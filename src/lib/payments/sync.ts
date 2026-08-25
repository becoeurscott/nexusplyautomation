import { and, desc, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { organizations, paymentCustomers, plans, subscriptions } from "@/db/schema";
import { stripe } from "./stripe";

/**
 * Reconciles our `subscriptions` row for one Stripe subscription against
 * whatever Stripe's own object currently says.
 *
 * Shared by `checkout.session.completed` and `customer.subscription.updated`/
 * `.deleted` rather than three separate handlers, because all three answer
 * the same question — "what does this Stripe subscription look like right
 * now" — and writing that three times invites them to drift out of sync
 * with each other. Always re-fetches the Subscription object rather than
 * trusting the event payload, since Stripe's own guidance is that the
 * database should sync to current Stripe state, not to whichever event
 * happened to arrive.
 *
 * Upserts on `providerSubRef`: the first time a Stripe subscription is seen
 * (normally at checkout) it inserts a new row, leaving the org's earlier
 * trial row as history rather than overwriting it — matches how
 * `getTrialState` already reads "most recent subscriptions row" as current.
 * Every subsequent sync for the same Stripe subscription updates that row
 * in place.
 */
export async function syncSubscriptionFromStripe(stripeSubscriptionId: string): Promise<{
  orgId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled";
} | null> {
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const orgId = await resolveOrgId(sub);
  if (!orgId) {
    console.error(`[stripe] could not resolve an org for subscription ${sub.id}`);
    return null;
  }

  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? await findPlanByPriceId(priceId) : null;
  if (!plan) {
    console.error(`[stripe] no plan matches price ${priceId} on subscription ${sub.id}`);
    return null;
  }

  const status = mapStatus(sub.status);
  const interval = plan.stripePriceIdAnnual === priceId ? "annual" : "monthly";
  const periodEnd = currentPeriodEnd(sub);

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.providerSubRef, sub.id),
    orderBy: desc(subscriptions.createdAt),
  });

  const values = {
    orgId,
    planId: plan.id,
    provider: "stripe" as const,
    providerSubRef: sub.id,
    status,
    billingInterval: interval as "monthly" | "annual",
    currentPeriodEnd: periodEnd,
    cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
  };

  if (existing) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values(values);
  }

  // organizations.planId tracks the org's current plan for anything that
  // reads it directly rather than joining through subscriptions.
  await db.update(organizations).set({ planId: plan.id }).where(eq(organizations.id, orgId));

  return { orgId, planId: plan.id, status };
}

/** Marks the most recent Stripe-provider row for this subscription past_due. */
export async function markSubscriptionPastDue(stripeSubscriptionId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: "past_due" })
    .where(eq(subscriptions.providerSubRef, stripeSubscriptionId));
}

async function resolveOrgId(sub: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = sub.metadata?.orgId;
  if (fromMetadata) return fromMetadata;

  // Defensive fallback — every subscription this app creates sets orgId in
  // metadata at checkout, so this path is for anything created outside that
  // flow (e.g. directly in the Stripe dashboard during testing).
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const row = await db.query.paymentCustomers.findFirst({
    where: and(
      eq(paymentCustomers.providerCustomerRef, customerId),
      eq(paymentCustomers.provider, "stripe"),
    ),
  });
  return row?.orgId ?? null;
}

async function findPlanByPriceId(priceId: string) {
  const [byMonthly] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceIdMonthly, priceId))
    .limit(1);
  if (byMonthly) return byMonthly;

  const [byAnnual] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceIdAnnual, priceId))
    .limit(1);
  return byAnnual ?? null;
}

function mapStatus(
  stripeStatus: Stripe.Subscription.Status,
): "trialing" | "active" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    // incomplete/incomplete_expired/paused are out of scope for v1 (see the
    // plan) — Checkout makes them rare, and anything landing here is closer
    // to "not really active" than to any of our four states, so treat it as
    // canceled rather than inventing a fifth status.
    default:
      return "canceled";
  }
}

/** Stripe's `current_period_end` lives on the subscription item as of newer API versions. */
function currentPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ts = sub.items.data[0]?.current_period_end ?? null;
  return ts ? new Date(ts * 1000) : null;
}
