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
    price: { KES: 0, NGN: 0, XOF: 0, USD: 0 },
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
    price: { KES: 500, NGN: 3_500, XOF: 3_000, USD: 3 },
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
    price: { KES: 1_500, NGN: 10_000, XOF: 9_000, USD: 9 },
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
    price: { KES: 5_000, NGN: 35_000, XOF: 30_000, USD: 30 },
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
  { credits: 100, price: { KES: 200, NGN: 1_500, XOF: 1_200, USD: 1.5 } },
  { credits: 500, price: { KES: 900, NGN: 6_500, XOF: 5_500, USD: 6 } },
  { credits: 2_000, price: { KES: 3_200, NGN: 22_000, XOF: 19_000, USD: 20 } },
  { credits: 10_000, price: { KES: 13_500, NGN: 95_000, XOF: 82_000, USD: 85 } },
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
