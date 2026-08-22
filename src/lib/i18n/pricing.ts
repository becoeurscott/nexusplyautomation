/**
 * Pricing table — USD only, cost-plus.
 *
 * Every plan and top-up pack is priced from real provider costs, not a
 * round-number guess. The credit itself retails at $0.02 (see
 * `src/lib/credits/prices.ts` for the per-action cost/margin breakdown —
 * every metered action already carries at least ~2–3x margin over our
 * estimated provider cost at that rate).
 *
 * Plan price = (included credits × $0.02) + a platform premium that covers
 * non-metered cost: extra seats, extra connected accounts, automations,
 * priority queue, API access, support. The premium is what actually protects
 * margin under heavy usage — a customer who maxes out video/repurposing
 * credits still leaves room above the credit-value floor.
 *
 * Payment happens via African rails (M-Pesa, MTN MoMo, Orange Money,
 * Flutterwave, Paystack) — those are *collection* methods, not pricing
 * currencies. The price a customer is billed is always this USD figure; the
 * payment processor handles FX conversion at checkout.
 */

export type PlanCode = "starter" | "school" | "institute" | "agency";

export type PlanRow = {
  code: PlanCode;
  name: string;
  tagline: string;
  /** Monthly price in USD. */
  priceUsd: number;
  credits: number;
  accounts: number | "∞";
  seats: number;
  highlights: string[];
  cta: string;
  featured?: boolean;
};

/** Retail rate a credit is sold at — keep in sync with `RETAIL_USD_PER_CREDIT` in credits/prices.ts. */
export const USD_PER_CREDIT = 0.02;

export const PLANS: PlanRow[] = [
  {
    code: "starter",
    name: "Starter",
    tagline: "For pilots and solo creators finding their footing.",
    priceUsd: 0,
    credits: 30,
    accounts: 3,
    seats: 1,
    highlights: [
      "3 connected accounts",
      "30 credits / month",
      "Compose, schedule, cross-post",
      "Community support",
    ],
    cta: "Start free",
  },
  {
    code: "school",
    name: "School",
    tagline: "For schools, community pages, and side hustles.",
    priceUsd: 9,
    credits: 300,
    accounts: 10,
    seats: 3,
    highlights: [
      "10 accounts, 3 seats",
      "300 credits / month",
      "Unified inbox + analytics",
      "M-Pesa / MoMo / Orange checkout",
    ],
    cta: "Start School",
  },
  {
    code: "institute",
    name: "Institute",
    tagline: "For institutes, SMBs, and growing brands.",
    priceUsd: 29,
    credits: 1_200,
    accounts: 40,
    seats: 10,
    highlights: [
      "40 accounts, 10 seats",
      "1 200 credits / month",
      "Automations + brand context",
      "Priority publishing queue",
    ],
    cta: "Start Institute",
    featured: true,
  },
  {
    code: "agency",
    name: "Agency",
    tagline: "For agencies and multi-client operators.",
    priceUsd: 149,
    credits: 5_000,
    accounts: "∞",
    seats: 25,
    highlights: [
      "Unlimited accounts, 25 seats",
      "5 000 credits / month",
      "White-label reports",
      "Programmatic API access",
    ],
    cta: "Start Agency",
  },
];

/** Top-up packs — bulk discount as size increases, still safely above cost. */
export const TOP_UP_PACKS: Array<{ credits: number; priceUsd: number }> = [
  { credits: 100, priceUsd: 2.99 },
  { credits: 500, priceUsd: 12.99 },
  { credits: 2_000, priceUsd: 44.99 },
  { credits: 10_000, priceUsd: 179.99 },
];

export function formatUsd(amount: number): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
