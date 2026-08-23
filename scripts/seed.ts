/**
 * Seed reference data: plans, top-up packs, credit prices.
 * Idempotent — safe to re-run. `npx tsx scripts/seed.ts`
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notInArray, sql } from "drizzle-orm";
import { creditPrices, plans, topUpProducts } from "../src/db/schema";
import { CREDIT_PRICE_SEED } from "../src/lib/credits/prices";
import { PLANS, TOP_UP_PACKS } from "../src/lib/i18n/pricing";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "prefer", prepare: false });
const db = drizzle(client);

async function main() {
  // Plans — one row per plan code. USD only, cost-plus (see src/lib/i18n/pricing.ts).
  for (const [i, p] of PLANS.entries()) {
    await db
      .insert(plans)
      .values({
        code: p.code,
        name: p.name,
        monthlyPriceLocal: String(p.priceUsd),
        currency: "USD",
        includedCredits: p.credits,
        perChannelCap: p.accounts,
        seatCap: p.seats,
        features: { highlights: p.highlights, tagline: p.tagline },
        sortOrder: i,
        active: true,
      })
      .onConflictDoUpdate({
        target: plans.code,
        set: {
          name: p.name,
          monthlyPriceLocal: String(p.priceUsd),
          includedCredits: p.credits,
          perChannelCap: p.accounts,
          seatCap: p.seats,
          features: { highlights: p.highlights, tagline: p.tagline },
          sortOrder: i,
          active: true,
        },
      });
  }
  // Retire any plan code no longer offered. Rows are deactivated rather than
  // deleted because `subscriptions.plan_id` references them — an old customer
  // must still resolve to the plan they signed up on.
  const live = PLANS.map((p) => p.code);
  const retired = await db
    .update(plans)
    .set({ active: false })
    .where(notInArray(plans.code, live))
    .returning({ code: plans.code });
  console.log(`plans: ${PLANS.length} active, ${retired.length} retired`);

  // Top-up packs — USD only.
  await db.delete(topUpProducts);
  for (const [i, pack] of TOP_UP_PACKS.entries()) {
    await db.insert(topUpProducts).values({
      credits: pack.credits,
      priceLocal: String(pack.priceUsd),
      currency: "USD",
      active: true,
      sortOrder: i,
    });
  }
  console.log(`top_up_products: ${TOP_UP_PACKS.length}`);

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
  // Remove action keys no longer offered. Unlike plans these are safe to
  // delete: credit_ledger records the key it charged as text, so history is
  // unaffected by pruning the price table.
  const liveKeys = CREDIT_PRICE_SEED.map((p) => p.actionKey);
  const dropped = await db
    .delete(creditPrices)
    .where(notInArray(creditPrices.actionKey, liveKeys))
    .returning({ key: creditPrices.actionKey });
  console.log(
    `credit_prices: ${CREDIT_PRICE_SEED.length} active` +
      (dropped.length ? `, ${dropped.length} removed (${dropped.map((d) => d.key).join(", ")})` : ""),
  );
}

main()
  .then(() => client.end())
  .catch(async (e) => {
    console.error(e);
    await client.end();
    process.exit(1);
  });
