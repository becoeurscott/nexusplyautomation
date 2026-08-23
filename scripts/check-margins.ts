/**
 * Proves the 50% margin floor. Run with `npx tsx scripts/check-margins.ts`.
 *
 * This is an acceptance test for a business constraint, not a lint. It exits
 * non-zero on any violation so a bad price change fails before it ships.
 *
 * It checks three things:
 *   1. Every priced action earns at least 2× its landed cost (= 50% margin).
 *   2. Every plan survives its whole allowance being burned at that floor.
 *   3. Every credit pack does the same.
 *
 * The per-action check is the one that matters: a customer can spend their
 * entire allowance on whichever single action suits them, so an average is not
 * a guarantee.
 */
import {
  MIN_MARGIN_MULTIPLE,
  assertMinimumMargins,
  marginTable,
} from "../src/lib/credits/prices";
import {
  PLANS,
  TOP_UP_PACKS,
  formatUsd,
  worstCaseCostUsd,
  worstCaseMargin,
} from "../src/lib/i18n/pricing";

const TARGET_MARGIN = 1 - 1 / MIN_MARGIN_MULTIPLE; // 2x => 0.50
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
let failed = 0;

console.log(`\nMargin floor: ${MIN_MARGIN_MULTIPLE}x landed cost (${pct(TARGET_MARGIN)})\n`);

console.log("ACTIONS");
for (const row of marginTable().sort((a, b) => a.multiple - b.multiple)) {
  if (row.credits === 0) continue;
  const ok = row.multiple >= MIN_MARGIN_MULTIPLE;
  if (!ok) failed++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${row.actionKey.padEnd(34)}` +
      `${String(row.credits).padStart(4)}cr  ` +
      `rev ${formatUsd(row.revenueUsd).padStart(7)}  ` +
      `cost ${formatUsd(row.landedCostUsd).padStart(7)}  ` +
      `${row.multiple.toFixed(1)}x  ${pct(row.margin).padStart(6)}`,
  );
}

console.log("\nPLANS (entire allowance burned at the floor)");
for (const plan of PLANS) {
  for (const [label, price, credits] of [
    ["monthly", plan.priceUsd, plan.credits],
    ["annual ", plan.priceUsdAnnual, plan.credits * 12],
  ] as const) {
    const margin = worstCaseMargin(price, credits);
    const ok = margin >= TARGET_MARGIN;
    if (!ok) failed++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${plan.name.padEnd(8)} ${label}  ` +
        `${formatUsd(price).padStart(7)}  ${String(credits).padStart(6)}cr  ` +
        `worst cost ${formatUsd(worstCaseCostUsd(credits)).padStart(7)}  ${pct(margin).padStart(6)}`,
    );
  }
}

console.log("\nCREDIT PACKS");
for (const pack of TOP_UP_PACKS) {
  const margin = worstCaseMargin(pack.priceUsd, pack.credits);
  const ok = margin >= TARGET_MARGIN;
  if (!ok) failed++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${String(pack.credits).padStart(6)}cr  ` +
      `${formatUsd(pack.priceUsd).padStart(6)}  ${pct(margin).padStart(6)}` +
      `${pack.active ? "" : "   (not sellable yet)"}`,
  );
}

try {
  assertMinimumMargins();
} catch (e) {
  console.error(`\nassertMinimumMargins: ${(e as Error).message}`);
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} margin violation(s) — not safe to ship.\n`);
  process.exit(1);
}
console.log(`\nAll margins hold at or above ${pct(TARGET_MARGIN)}.\n`);
