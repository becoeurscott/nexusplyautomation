import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, paymentCustomers, plans } from "@/db/schema";
import { stripe } from "./stripe";
import { siteUrl } from "@/lib/oauth/connections";
import type { PlanCode } from "@/lib/i18n/pricing";

export type BillingInterval = "monthly" | "annual";

export class PlanNotPurchasableError extends Error {}

/**
 * Gets or creates the org's Stripe Customer.
 *
 * Created lazily, on first checkout attempt — not at signup. Every trial
 * signup would otherwise spam the Stripe customer list with people who never
 * intend to pay. Reuses `payment_customers`, which already existed in the
 * schema for exactly this (`orgId`+`provider` primary key) — see the plan
 * for why this table didn't need to be invented.
 */
export async function getOrCreateStripeCustomer(orgId: string): Promise<string> {
  const existing = await db.query.paymentCustomers.findFirst({
    where: and(eq(paymentCustomers.orgId, orgId), eq(paymentCustomers.provider, "stripe")),
  });
  if (existing) return existing.providerCustomerRef;

  const [org] = await db
    .select({ name: organizations.name, ownerId: organizations.ownerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) throw new Error(`Organization ${orgId} not found`);

  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { orgId },
  });

  await db
    .insert(paymentCustomers)
    .values({ orgId, provider: "stripe", providerCustomerRef: customer.id })
    .onConflictDoNothing();

  return customer.id;
}

function priceIdFor(
  plan: { stripePriceIdMonthly: string | null; stripePriceIdAnnual: string | null },
  interval: BillingInterval,
): string {
  const priceId = interval === "annual" ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
  if (!priceId) {
    throw new PlanNotPurchasableError(
      `No Stripe price configured for this plan at ${interval} billing yet.`,
    );
  }
  return priceId;
}

/**
 * Creates a hosted Checkout Session and returns its URL to redirect to.
 *
 * `subscription_data.metadata.orgId` is the only reliable link back to our
 * org once control passes to Stripe's page — Stripe's own ids mean nothing
 * to us until the webhook reads this back off the resulting subscription.
 */
export async function createCheckoutSession(opts: {
  orgId: string;
  planCode: PlanCode;
  interval: BillingInterval;
}): Promise<string> {
  const [plan] = await db.select().from(plans).where(eq(plans.code, opts.planCode)).limit(1);
  if (!plan) throw new Error(`Unknown plan code "${opts.planCode}"`);

  const priceId = priceIdFor(plan, opts.interval);
  const customerId = await getOrCreateStripeCustomer(opts.orgId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { orgId: opts.orgId, planCode: opts.planCode } },
    success_url: `${siteUrl()}/app/settings?checkout=success`,
    cancel_url: `${siteUrl()}/app/settings?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}

/** One call to Stripe's own self-serve portal — update card, cancel, view invoices. */
export async function createBillingPortalSession(orgId: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(orgId);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl()}/app/settings`,
  });
  return portal.url;
}
