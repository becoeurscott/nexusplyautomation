/**
 * African-first pricing table. Values are the display-facing monthly price
 * per plan per currency. Source of truth for the DB `plans` table seed and
 * for the landing-page pricing section.
 */

export const CURRENCIES = ["KES", "NGN", "XOF", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_META: Record<
  Currency,
  { symbol: string; name: string; flag: string; locale: string }
> = {
  KES: { symbol: "KSh", name: "Kenyan Shilling", flag: "🇰🇪", locale: "en-KE" },
  NGN: { symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬", locale: "en-NG" },
  XOF: {
    symbol: "CFA",
    name: "West African Franc",
    flag: "🇨🇮",
    locale: "fr-CI",
  },
  USD: { symbol: "$", name: "US Dollar", flag: "🌍", locale: "en-US" },
};

/**
 * FX anchors — USD is the single source of truth; every local price is
 * derived from it so the tiers stay consistent across currencies.
 * Update these when rates move (admin-editable later). Mid-market, Aug 2026.
 */
export const USD_RATES: Record<Currency, number> = {
  USD: 1,
  KES: 129.5,
  NGN: 1355,
  XOF: 562,
};

/** Round to a "clean" local figure so prices look deliberate, not converted. */
function roundLocal(amount: number, currency: Currency): number {
  if (amount === 0) return 0;
  switch (currency) {
    case "USD":
      return Math.round(amount * 100) / 100;
    case "KES":
      return amount < 1000 ? Math.round(amount / 10) * 10 : Math.round(amount / 50) * 50;
    case "NGN":
      return amount < 10_000 ? Math.round(amount / 100) * 100 : Math.round(amount / 500) * 500;
    case "XOF":
      return amount < 10_000 ? Math.round(amount / 100) * 100 : Math.round(amount / 500) * 500;
  }
}

/** Build the per-currency price map from a USD amount. */
export function localize(usd: number): Record<Currency, number> {
  return Object.fromEntries(
    CURRENCIES.map((c) => [c, roundLocal(usd * USD_RATES[c], c)]),
  ) as Record<Currency, number>;
}

export type PlanCode = "starter" | "school" | "institute" | "agency";

export type PlanRow = {
  code: PlanCode;
  name: string;
  tagline: string;
  price: Record<Currency, number>;
  credits: number;
  accounts: number | "∞";
  seats: number;
  highlights: string[];
  cta: string;
  featured?: boolean;
};

export const PLANS: PlanRow[] = [
  {
    code: "starter",
    name: "Starter",
    tagline: "For pilots and solo creators finding their footing.",
    price: localize(0),
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
    price: localize(3),
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
    price: localize(9),
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
    price: localize(30),
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

export const TOP_UP_PACKS: Array<{ credits: number; price: Record<Currency, number> }> = [
  { credits: 100, price: localize(1.5) },
  { credits: 500, price: localize(6) },
  { credits: 2_000, price: localize(20) },
  { credits: 10_000, price: localize(85) },
];

/**
 * Best-effort currency guess from request headers. Runs on the server so the
 * landing page shows a locally-appropriate currency before hydration.
 * Reads Vercel's `x-vercel-ip-country` first; falls back to Accept-Language.
 */
export function detectCurrencyFromHeaders(headers: Headers): Currency {
  const country = headers.get("x-vercel-ip-country")?.toUpperCase();
  if (country) {
    const c = COUNTRY_TO_CURRENCY[country];
    if (c) return c;
  }
  const lang = headers.get("accept-language")?.toLowerCase() ?? "";
  if (lang.includes("sw") || lang.includes("en-ke")) return "KES";
  if (lang.includes("yo") || lang.includes("en-ng") || lang.includes("ha") || lang.includes("ig")) return "NGN";
  if (lang.includes("fr-ci") || lang.includes("fr-sn") || lang.includes("fr-bf") || lang.includes("fr-ml")) return "XOF";
  return "KES";
}

const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // KES corridor
  KE: "KES",
  TZ: "KES",
  UG: "KES",
  RW: "KES",
  // NGN corridor
  NG: "NGN",
  GH: "NGN",
  // XOF corridor (WAEMU)
  CI: "XOF",
  SN: "XOF",
  BF: "XOF",
  ML: "XOF",
  BJ: "XOF",
  TG: "XOF",
  NE: "XOF",
  GW: "XOF",
};

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return "Free";
  const meta = CURRENCY_META[currency];
  const formatted = new Intl.NumberFormat(meta.locale, {
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount);
  return currency === "USD" ? `${meta.symbol}${formatted}` : `${meta.symbol} ${formatted}`;
}
