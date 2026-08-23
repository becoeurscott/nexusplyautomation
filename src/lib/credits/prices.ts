/**
 * Seed table for `credit_prices`. Hot-editable in admin; this file is the
 * initial-load source used by `scripts/seed.ts`.
 *
 * Action keys are namespaced by CAPABILITY, not by vendor — `media.*`, not the
 * name of whoever generates the media this month. These keys are stored in
 * `credit_prices` and referenced from `credit_ledger`, so a vendor name baked
 * into a key turns every supplier change into a data migration.
 *
 * ── PRICING MODEL ────────────────────────────────────────────────────────────
 *
 * 1 credit = $0.01 of internal usage value. That relationship is never shown to
 * customers: they buy a plan and spend "creation credits" on activities.
 *
 * THE MARGIN RULE, and why it is per-action:
 *
 *     credits × RETAIL_USD_PER_CREDIT  >=  2 × (estCostUsd × OPENROUTER_FEE)
 *
 * Margin has to hold for the *worst* action, not the average one, because a
 * customer can spend their entire monthly allowance on whichever action is
 * cheapest for them and most expensive for us. If every action clears 2×, then
 * any mix of actions clears 2×, and therefore every plan clears 50% — which is
 * the business constraint this file exists to guarantee.
 *
 * `assertMinimumMargins()` enforces it and `scripts/check-margins.ts` runs it.
 * A violation is a failure, not a warning.
 *
 * Costs below are per-unit provider spend from published rates (Aug 2026):
 *   text, fast tier   google/gemini-2.5-flash      $0.30/M in, $2.50/M out
 *   text, smart tier  anthropic/claude-sonnet-5    $2.00/M in, $10.00/M out
 *   image, standard   google/gemini-2.5-flash-image ~$0.004 per image
 *   image, premium    bytedance-seed/seedream-4.5   ~$0.04 per image
 *   video             Veo 3.1 Lite                  ~$0.05 per second
 * Re-run the margin check whenever a provider's rates move.
 */

export type CreditPriceSeed = {
  actionKey: string;
  credits: number;
  description: string;
  /** Estimated real provider cost in USD for this action, before fees. */
  estCostUsd: number;
};

/** 1 credit = $0.01 of internal usage value. Internal only — never surfaced. */
export const RETAIL_USD_PER_CREDIT = 0.01;

/**
 * OpenRouter charges a 5.5% platform fee on credit purchases, so our landed
 * cost is always above the model's headline rate. Margin computed against the
 * headline rate alone would overstate profit on every single action.
 */
export const OPENROUTER_FEE_MULTIPLIER = 1.055;

/** 2× landed cost == 50% margin. The business constraint, as a number. */
export const MIN_MARGIN_MULTIPLE = 2;

/** Video billed beyond the base clip. See `media.video.generate`. */
export const VIDEO_BASE_SECONDS = 3;
export const VIDEO_CREDITS_PER_EXTRA_SECOND = 12;

export const CREDIT_PRICE_SEED: CreditPriceSeed[] = [
  // ── Publishing ────────────────────────────────────────────────────────────
  // Near-zero marginal cost; priced for value and to discourage spam rather
  // than to recover compute.
  { actionKey: "zernio.post.create", credits: 1, estCostUsd: 0.001, description: "Schedule or publish a post" },
  { actionKey: "zernio.post.cross_extra_account", credits: 1, estCostUsd: 0.001, description: "Send the same post to one extra account" },
  { actionKey: "zernio.post.edit", credits: 1, estCostUsd: 0.001, description: "Edit a scheduled post" },
  { actionKey: "zernio.post.retry", credits: 1, estCostUsd: 0.001, description: "Retry a failed post" },
  { actionKey: "zernio.inbox.reply", credits: 1, estCostUsd: 0.001, description: "Reply to a comment or mention" },
  { actionKey: "zernio.analytics.refresh", credits: 1, estCostUsd: 0.001, description: "Refresh analytics" },

  // ── Writing (fast tier) ───────────────────────────────────────────────────
  { actionKey: "ai.caption.generate", credits: 1, estCostUsd: 0.0005, description: "Write a caption" },
  { actionKey: "ai.caption.polish", credits: 1, estCostUsd: 0.0004, description: "Rewrite or polish a caption" },
  { actionKey: "ai.idea.generate", credits: 1, estCostUsd: 0.0005, description: "Suggest a post idea" },
  { actionKey: "ai.hashtags.generate", credits: 1, estCostUsd: 0.0004, description: "Suggest a hashtag set" },
  { actionKey: "ai.translate", credits: 1, estCostUsd: 0.0005, description: "Translate a caption or script" },
  { actionKey: "ai.summarize", credits: 1, estCostUsd: 0.0005, description: "Summarise a piece of content" },
  { actionKey: "ai.post.long_form", credits: 2, estCostUsd: 0.0014, description: "Write a long-form post" },
  { actionKey: "ai.carousel.copy", credits: 3, estCostUsd: 0.0025, description: "Write carousel copy" },

  // ── Writing (smart tier) ──────────────────────────────────────────────────
  { actionKey: "ai.reply.draft", credits: 2, estCostUsd: 0.003, description: "Draft an inbox reply in your brand voice" },
  { actionKey: "ai.script.generate", credits: 5, estCostUsd: 0.011, description: "Write a video script" },
  { actionKey: "ai.brand_voice.analyze", credits: 10, estCostUsd: 0.012, description: "Analyse your brand voice" },
  // Closest row to the floor (~51%). A provider price rise breaks this one
  // first, so re-price it rather than absorbing the loss.
  { actionKey: "ai.calendar.month.generate", credits: 10, estCostUsd: 0.046, description: "Generate a month of content strategy" },

  // ── Images ────────────────────────────────────────────────────────────────
  { actionKey: "media.image.generate", credits: 8, estCostUsd: 0.004, description: "Create an image" },
  { actionKey: "media.image.premium", credits: 15, estCostUsd: 0.04, description: "Create a premium image" },
  { actionKey: "media.image.edit", credits: 10, estCostUsd: 0.03, description: "Edit an image" },
  { actionKey: "media.image.upscale", credits: 3, estCostUsd: 0.01, description: "Upscale an image" },
  { actionKey: "media.image.remove_bg", credits: 2, estCostUsd: 0.008, description: "Remove an image background" },

  // ── Video ─────────────────────────────────────────────────────────────────
  // 40 credits ($0.40) covers 3 seconds at ~$0.05/s: $0.15 cost, $0.158 landed,
  // 60% margin. A 4th second would drop it to 47%, which is why the clip is
  // capped and extra seconds bill separately at 12 credits each.
  { actionKey: "media.video.generate", credits: 40, estCostUsd: 0.15, description: "Create a short video (3 seconds)" },
  { actionKey: "media.video.extra_second", credits: VIDEO_CREDITS_PER_EXTRA_SECOND, estCostUsd: 0.05, description: "Add one second of video" },
  { actionKey: "media.video.reframe", credits: 15, estCostUsd: 0.05, description: "Reframe a video for another platform" },
  { actionKey: "media.voice.generate", credits: 6, estCostUsd: 0.02, description: "Generate a voiceover" },
  { actionKey: "media.dub", credits: 30, estCostUsd: 0.1, description: "Dub a video into another language" },

  // ── Repurposing ───────────────────────────────────────────────────────────
  { actionKey: "cloneviral.long_to_shorts.render", credits: 110, estCostUsd: 0.5, description: "Turn a long video into vertical shorts" },
  { actionKey: "cloneviral.video.analyze", credits: 15, estCostUsd: 0.06, description: "Find the strongest clips in a video" },
  { actionKey: "cloneviral.translate", credits: 30, estCostUsd: 0.12, description: "Translate a video" },

  // ── Bundles ───────────────────────────────────────────────────────────────
  // Compositions of the writing actions above, priced as one purchase because
  // "Generate my month" is what a customer actually wants to buy.
  { actionKey: "bundle.week.generate", credits: 50, estCostUsd: 0.012, description: "7-Day Content Pack" },
  { actionKey: "bundle.month.generate", credits: 200, estCostUsd: 0.064, description: "30-Day Content Pack" },

  // ── Free ──────────────────────────────────────────────────────────────────
  { actionKey: "automation.tick", credits: 0, estCostUsd: 0, description: "Automation run (actions inside it bill separately)" },
  { actionKey: "trend.snapshot", credits: 0, estCostUsd: 0, description: "Daily trend snapshot" },
  { actionKey: "trend.detail_view", credits: 1, estCostUsd: 0.0005, description: "Open a detailed trend report" },
];

export const CREDIT_PRICE_MAP: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(CREDIT_PRICE_SEED.map((p) => [p.actionKey, p.credits])),
);

/** Landed cost of one action: provider rate plus the platform fee. */
export function landedCostUsd(seed: CreditPriceSeed): number {
  return seed.estCostUsd * OPENROUTER_FEE_MULTIPLIER;
}

/** Revenue one action earns at the internal credit rate. */
export function revenueUsd(seed: CreditPriceSeed): number {
  return seed.credits * RETAIL_USD_PER_CREDIT;
}

export type MarginRow = {
  actionKey: string;
  credits: number;
  landedCostUsd: number;
  revenueUsd: number;
  /** Revenue ÷ landed cost. Infinity for free actions. */
  multiple: number;
  /** 0–1. Infinity-safe: free actions report 1. */
  margin: number;
};

export function marginTable(): MarginRow[] {
  return CREDIT_PRICE_SEED.map((seed) => {
    const cost = landedCostUsd(seed);
    const revenue = revenueUsd(seed);
    return {
      actionKey: seed.actionKey,
      credits: seed.credits,
      landedCostUsd: cost,
      revenueUsd: revenue,
      multiple: cost === 0 ? Infinity : revenue / cost,
      margin: cost === 0 ? 1 : (revenue - cost) / revenue,
    };
  });
}

/**
 * Throws if any priced action earns less than `minMultiple` times its landed
 * cost. Free actions (0 credits, 0 cost) are exempt by definition.
 *
 * This is the guard behind the 50% margin promise — keep it called from
 * `scripts/check-margins.ts` and run it before shipping a price change.
 */
export function assertMinimumMargins(minMultiple = MIN_MARGIN_MULTIPLE): void {
  const failures = marginTable().filter(
    (row) => row.credits > 0 && row.multiple < minMultiple,
  );
  if (failures.length > 0) {
    const detail = failures
      .map(
        (f) =>
          `${f.actionKey}: ${f.credits}cr = $${f.revenueUsd.toFixed(4)} vs landed $${f.landedCostUsd.toFixed(4)} (${f.multiple.toFixed(2)}x, ${(f.margin * 100).toFixed(1)}% margin)`,
      )
      .join("\n  ");
    throw new Error(
      `${failures.length} action(s) below the ${minMultiple}x floor:\n  ${detail}`,
    );
  }
}
