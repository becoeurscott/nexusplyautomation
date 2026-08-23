/**
 * Plan table — USD only.
 *
 * These are the customer-facing plans. Credits are still how the platform
 * meters cost internally (see `src/lib/credits/prices.ts`), but they are no
 * longer part of how the product is sold — a business owner buys a level of
 * service, not a unit of compute.
 *
 * Payment happens over African rails (M-Pesa, MTN MoMo, Orange Money,
 * Flutterwave, Paystack). Those are *collection* methods, not pricing
 * currencies: the customer is billed this USD figure and the processor
 * handles FX at checkout.
 */

export type PlanCode = "start" | "grow" | "scale";

export type PlanRow = {
  code: PlanCode;
  name: string;
  tagline: string;
  /** Monthly price in USD. */
  priceUsd: number;
  highlights: string[];
  cta: string;
  featured?: boolean;

  /* --- Internal entitlements — enforced, never advertised --------------- */
  /* The product is sold as a level of service, so these numbers don't appear
     anywhere on the site. The platform still needs them: they seed the `plans`
     table and cap what an account can actually consume. Credits are costed at
     $0.02 retail (see credits/prices.ts), so each plan keeps a clear margin
     over the credit value it grants even when fully consumed. */
  /** Monthly credit allowance. */
  credits: number;
  /** Connected social accounts; null = unlimited. */
  accounts: number | null;
  /** Team seats. */
  seats: number;
};

export const PLANS: PlanRow[] = [
  {
    code: "start",
    name: "Start",
    tagline: "For businesses starting their social presence.",
    priceUsd: 19,
    highlights: [
      "Content planning",
      "Content creation",
      "Content calendar",
      "Scheduling",
      "Multi-platform publishing",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    credits: 500,
    accounts: 5,
    seats: 2,
  },
  {
    code: "grow",
    name: "Grow",
    tagline: "For businesses ready to become more consistent.",
    priceUsd: 39,
    highlights: [
      "Everything in Start",
      "More content capacity",
      "Advanced scheduling",
      "Engagement management",
      "Advanced analytics",
      "Content optimization",
      "More connected accounts",
    ],
    cta: "Start Free Trial",
    featured: true,
    credits: 1_200,
    accounts: 15,
    seats: 5,
  },
  {
    code: "scale",
    name: "Scale",
    tagline: "For businesses that want social media fully integrated into their workflow.",
    priceUsd: 79,
    highlights: [
      "Everything in Grow",
      "Advanced automation",
      "Lead workflows",
      "Customer follow-up",
      "Expanded account management",
      "Priority support",
      "Advanced reporting",
    ],
    cta: "Start Free Trial",
    credits: 3_000,
    accounts: null,
    seats: 15,
  },
];

/**
 * Top-up packs — internal too. Credits aren't marketed any more, but the
 * platform can still grant or sell extra capacity, and the seed script writes
 * these into `top_up_products`.
 */
export const TOP_UP_PACKS: Array<{ credits: number; priceUsd: number }> = [
  { credits: 100, priceUsd: 2.99 },
  { credits: 500, priceUsd: 12.99 },
  { credits: 2_000, priceUsd: 44.99 },
  { credits: 10_000, priceUsd: 179.99 },
];

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
