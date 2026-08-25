import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentIntents, plans, webhookEventsIn } from "@/db/schema";
import { getBalance, writeLedger } from "@/lib/credits";
import { stripe } from "@/lib/payments/stripe";
import { markSubscriptionPastDue, syncSubscriptionFromStripe } from "@/lib/payments/sync";

/**
 * Stripe's inbound webhook. Nothing here redirects a browser — unlike the
 * TikTok callback route, no person is looking at this request. Stripe reads
 * the HTTP status to decide whether to retry (anything but 2xx retries for
 * up to 3 days with backoff), so every branch returns a plain status code.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // The RAW body, never req.json() — signature verification needs the exact
  // bytes Stripe sent; re-serializing a parsed object would not match.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.error("[stripe webhook] signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency shield: insert before processing. Stripe retries the same
  // event for up to 3 days on anything but a 2xx, so a replay is expected,
  // routine behaviour, not an edge case — this is what makes a replay a
  // no-op instead of a duplicate credit grant or a double-processed invoice.
  const [inserted] = await db
    .insert(webhookEventsIn)
    .values({ source: "stripe", eventId: event.id, payload: event as unknown as object })
    .onConflictDoNothing({ target: [webhookEventsIn.source, webhookEventsIn.eventId] })
    .returning({ id: webhookEventsIn.id });

  if (!inserted) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    await handleEvent(event);
    await db
      .update(webhookEventsIn)
      .set({ processedAt: new Date() })
      .where(and(eq(webhookEventsIn.source, "stripe"), eq(webhookEventsIn.eventId, event.id)));
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error(`[stripe webhook] failed to process ${event.type} (${event.id})`, e);
    await db
      .update(webhookEventsIn)
      .set({ error: e instanceof Error ? e.message : String(e) })
      .where(and(eq(webhookEventsIn.source, "stripe"), eq(webhookEventsIn.eventId, event.id)));
    // 500, not 200 — a genuine processing failure should make Stripe retry.
    // The idempotency check above still protects against double-processing
    // once a retry succeeds, since processedAt stays null until it does.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === "string") {
        await syncSubscriptionFromStripe(session.subscription);
      }
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(sub.id);
      return;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(invoice);
      if (subId) await markSubscriptionPastDue(subId);
      return;
    }

    default:
      // Every other event type is intentionally unhandled — see the plan
      // for why v1 sticks to these five (Checkout removes most of the
      // incomplete/requires-action states other integrations have to
      // handle, and Stripe's dashboard is configured to skip the `unpaid`
      // limbo state rather than park subscriptions there).
      return;
  }
}

/** `invoice.subscription` moved under `parent` in newer API versions; check both. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object") return legacy.id;

  const parent = invoice.parent;
  if (parent?.type === "subscription_details" && parent.subscription_details?.subscription) {
    const s = parent.subscription_details.subscription;
    return typeof s === "string" ? s : s.id;
  }
  return null;
}

/**
 * The credit reset for Stripe-billed orgs. The daily cron
 * (credit-refill.ts) explicitly skips `provider = "stripe"` subscriptions —
 * this is where their credits actually reset, against the period Stripe
 * itself just confirmed was paid for, not a locally-computed +1-month guess.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const synced = await syncSubscriptionFromStripe(subId);
  if (!synced) return;

  const [plan] = await db
    .select({ includedCredits: plans.includedCredits })
    .from(plans)
    .where(eq(plans.id, synced.planId))
    .limit(1);
  const includedCredits = plan?.includedCredits ?? 0;

  if (includedCredits > 0) {
    const currentBalance = await getBalance(synced.orgId);
    const delta = includedCredits - currentBalance;
    if (delta !== 0) {
      await writeLedger({
        orgId: synced.orgId,
        delta,
        reason: "plan_refill",
        refType: "stripe_invoice",
        refId: invoice.id,
        note: `Reset to plan allowance (${includedCredits}) on invoice payment`,
      });
    }
  }

  await db.insert(paymentIntents).values({
    orgId: synced.orgId,
    provider: "stripe",
    providerRef: invoice.id ?? `${subId}-${invoice.created}`,
    amount: String((invoice.amount_paid ?? 0) / 100),
    currency: invoice.currency,
    kind: "subscription",
    status: "succeeded",
    metadata: { subscriptionId: subId },
  }).onConflictDoNothing();
}
