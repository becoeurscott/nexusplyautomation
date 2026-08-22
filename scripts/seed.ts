/**
 * Seed reference data: plans, top-up packs, credit prices.
 * Idempotent — safe to re-run. `npx tsx scripts/seed.ts`
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { creditPrices, plans, topUpProducts } from "../src/db/schema";
import { CREDIT_PRICE_SEED } from "../src/lib/credits/prices";
import { PLANS, TOP_UP_PACKS } from "../src/lib/i18n/pricing";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "prefer", prepare: false });
const db = drizzle(client);

async function main() {
  // Plans — one row per plan code, priced in USD as the canonical currency;
  // per-currency display comes from src/lib/i18n/pricing.ts.
  for (const [i, p] of PLANS.entries()) {
    await db
      .insert(plans)
      .values({
        code: p.code,
        name: p.name,
        monthlyPriceLocal: String(p.price.USD),
        currency: "USD",
        includedCredits: p.credits,
        perChannelCap: p.accounts === "∞" ? null : p.accounts,
        seatCap: p.seats,
        features: { highlights: p.highlights, tagline: p.tagline },
        sortOrder: i,
        active: true,
      })
      .onConflictDoUpdate({
        target: plans.code,
        set: {
          name: p.name,
          monthlyPriceLocal: String(p.price.USD),
          includedCredits: p.credits,
          perChannelCap: p.accounts === "∞" ? null : p.accounts,
          seatCap: p.seats,
          features: { highlights: p.highlights, tagline: p.tagline },
          sortOrder: i,
          active: true,
        },
      });
  }
  console.log(`plans: ${PLANS.length}`);

  // Top-up packs — one row per (credits, currency)
  await db.delete(topUpProducts);
  let n = 0;
  for (const [i, pack] of TOP_UP_PACKS.entries()) {
    for (const [currency, price] of Object.entries(pack.price)) {
      await db.insert(topUpProducts).values({
        credits: pack.credits,
        priceLocal: String(price),
        currency,
        active: true,
        sortOrder: i,
      });
      n++;
    }
  }
  console.log(`top_up_products: ${n}`);

  // Credit prices
  for (const p of CREDIT_PRICE_SEED) {
    await db
      .insert(creditPrices)
      .values({ actionKey: p.actionKey, credits: p.credits, description: p.description })
      .onConflictDoUpdate({
        target: creditPrices.actionKey,
        set: { credits: p.credits, description: p.description, updatedAt: sql`now()` },
      });
  }
  console.log(`credit_prices: ${CREDIT_PRICE_SEED.length}`);
}

main()
  .then(() => client.end())
  .catch(async (e) => {
    console.error(e);
    await client.end();
    process.exit(1);
  });
