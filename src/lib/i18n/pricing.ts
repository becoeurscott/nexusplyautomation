/**
 * Plan table — USD only.
 *
 * Subscription buys access to the platform; credits meter the expensive AI
 * work on top of it. That split is deliberate: a flat fee against variable
 * compute lets one heavy user consume more than they pay, and unlimited
 * generation at $19 is not a business.
 *
 * Customers see "creation credits" and spend them on activities (see
 * `src/lib/credits/activities.ts`). They never see the $0.01-per-credit
 * internal rate, and no marketing surface mentions tokens or models.
 *
 * Every allowance here is safe by construction: `src/lib/credits/prices.ts`
 * holds every action to at least 2× landed cost, so an allowance spent
 * entirely on the worst-value action still leaves 50% margin. The
 * `worstCaseCostUsd` helper below makes that checkable rather than asserted.
 */

import { RETAIL_USD_PER_CREDIT, MIN_MARGIN_MULTIPLE } from "@/lib/credits/prices";

export type PlanCode = "starter" | "growth" | "pro" | "agency";

export type PlanRow = {
  code: PlanCode;
  name: string;
  tagline: string;
  /** Monthly price in USD. */
  priceUsd: number;
  /** Annual price in USD — two months free. */
  priceUsdAnnual: number;
  /** Monthly creation credits. Shown to customers. */
  credits: number;
  highlights: string[];
  cta: string;
  featured?: boolean;

  /* --- Internal entitlements, enforced but not advertised --------------- */
  /** Connected social accounts; null = unlimited. */
  accounts: number | null;
  /** Team seats. */
  seats: number;
};

/** Annual billing gives two months free — a ~17% saving. */
export const ANNUAL_MONTHS_CHARGED = 10;

/**
 * A `highlight` is a promise. Only list something a customer on that plan can
 * actually do today.
 *
 * Two things are deliberately absent and should stay absent until they ship:
 * **competitor tracking** (the publishing API has no way to read an account the
 * customer doesn't own, so `trend_watchlists.competitor_handles` is unfillable
 * — see src/lib/trends), and **the browser extension** (not built). Growth's
 * line previously read "Advanced analytics and content optimisation", which
 * sounded like both; it now says what the feature actually does.
 */
export const PLANS: PlanRow[] = [
  {
    code: "starter",
    name: "Starter",
    tagline: "For a small business getting consistent.",
    priceUsd: 19,
    priceUsdAnnual: 190,
    credits: 500,
    highlights: [
      "500 creation credits a month",
      "Content planning and calendar",
      "Scheduling and multi-platform publishing",
      "Post scoring and hashtag suggestions",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    accounts: 5,
    seats: 2,
  },
  {
    code: "growth",
    name: "Growth",
    tagline: "For businesses posting every week.",
    priceUsd: 39,
    priceUsdAnnual: 390,
    credits: 1_500,
    highlights: [
      "1,500 creation credits a month",
      "Everything in Starter",
      "More connected accounts",
      "Engagement management",
      "See what's working across your own posts",
    ],
    cta: "Start Free Trial",
    featured: true,
    accounts: 15,
    seats: 5,
  },
  {
    code: "pro",
    name: "Pro",
    tagline: "For teams running social as a channel.",
    priceUsd: 79,
    priceUsdAnnual: 790,
    credits: 4_000,
    highlights: [
      "4,000 creation credits a month",
      "Everything in Growth",
      "Advanced automation",
      "Team features",
      "Priority processing",
    ],
    cta: "Start Free Trial",
    accounts: 40,
    seats: 15,
  },
  {
    code: "agency",
    name: "Agency",
    tagline: "For agencies managing several brands.",
    priceUsd: 149,
    priceUsdAnnual: 1_490,
    credits: 10_000,
    highlights: [
      "10,000 creation credits a month",
      "Everything in Pro",
      "Multiple brands and client workspaces",
      "White-label options",
      "Advanced reporting",
    ],
    cta: "Start Free Trial",
    accounts: null,
    seats: 25,
  },
];

export type CreditPack = {
  credits: number;
  priceUsd: number;
  /**
   * Packs are defined but NOT sellable yet.
   *
   * The balance is currently a single number that resets each billing cycle,
   * so a purchased pack would be wiped at the next reset. That is only safe
   * because there is no checkout — nobody can buy one. Before setting this
   * true, split the balance into plan credits (reset) and purchased credits
   * (roll over), otherwise customers lose credits they paid for.
   */
  active: boolean;
};

export const TOP_UP_PACKS: CreditPack[] = [
  { credits: 500, priceUsd: 9, active: false },
  { credits: 1_500, priceUsd: 24, active: false },
  { credits: 5_000, priceUsd: 69, active: false },
  { credits: 10_000, priceUsd: 119, active: false },
];

/**
 * Worst case an allowance can cost us: every credit spent on an action priced
 * exactly at the margin floor. Real usage is far cheaper, since most actions
 * sit well above the floor — this is the number that has to stay safe.
 */
export function worstCaseCostUsd(credits: number): number {
  return (credits * RETAIL_USD_PER_CREDIT) / MIN_MARGIN_MULTIPLE;
}

/** Margin (0–1) if a customer burns their entire allowance at the floor. */
export function worstCaseMargin(priceUsd: number, credits: number): number {
  if (priceUsd <= 0) return 0;
  return (priceUsd - worstCaseCostUsd(credits)) / priceUsd;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
