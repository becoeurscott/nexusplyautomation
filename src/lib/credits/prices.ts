/**
 * Seed table for `credit_prices`. Hot-editable in admin; this file is
 * the initial-load source that runs on `pnpm db:push` or a first-boot script.
 *
 * Actions are namespaced by producer: `zernio.*`, `higgsfield.*`, `cloneviral.*`,
 * `ai.*`, `automation.*`, `trend.*`.
 *
 * PRICING MODEL — cost-plus, USD only.
 * Retail credit rate: 1 credit = $0.02 (matches `TOP_UP_PACKS` and the
 * bundled rate inside every plan in `src/lib/i18n/pricing.ts` — keep both
 * files in sync if this rate changes).
 *
 * Every row below is sized so `credits * $0.02 >= estCostUsd * 3` — i.e. at
 * least 3x real provider cost, even under worst-case usage. High-frequency,
 * low-cost actions (scheduling a post) run a thinner ~2x margin since volume
 * carries them; heavy compute (video, cloning, long-form repurposing) is held
 * to a strict 3x floor because a single power user maxing these out is the
 * actual risk to plan-level profitability.
 *
 * `estCostUsd` is our best real-world estimate of the underlying provider
 * spend per unit action (comparable API/model pricing, Aug 2026). Update
 * this comment and re-run the margin check whenever a provider's rates move.
 */

export type CreditPriceSeed = {
  actionKey: string;
  credits: number;
  description: string;
  /** Estimated real provider cost in USD for this action, for margin auditing. */
  estCostUsd: number;
};

const RETAIL_USD_PER_CREDIT = 0.02;

export const CREDIT_PRICE_SEED: CreditPriceSeed[] = [
  // Publishing / inbox / analytics — thin margin, high frequency; the base
  // subscription fee (not the credit) is where these actions actually profit.
  { actionKey: "zernio.post.create", credits: 1, estCostUsd: 0.01, description: "Schedule or publish one post to one account" },
  { actionKey: "zernio.post.cross_extra_account", credits: 1, estCostUsd: 0.01, description: "Extra account when cross-posting (per additional account)" },
  { actionKey: "zernio.post.edit", credits: 0, estCostUsd: 0, description: "Edit an already-scheduled post (bundled in subscription)" },
  { actionKey: "zernio.post.retry", credits: 0, estCostUsd: 0, description: "Retry a failed post (free — original debit stands or was refunded)" },
  { actionKey: "zernio.inbox.reply", credits: 0, estCostUsd: 0, description: "Reply to a comment or mention (bundled in subscription)" },
  { actionKey: "zernio.analytics.refresh", credits: 0, estCostUsd: 0, description: "Manual analytics refresh (bundled in subscription)" },

  // AI text (Claude for hard tasks, Gemini Flash for cheap ones — packages/ai)
  { actionKey: "ai.caption.generate", credits: 2, estCostUsd: 0.004, description: "Generate one platform-specific caption" },
  { actionKey: "ai.caption.polish", credits: 1, estCostUsd: 0.001, description: "Cheap-model polish of a user-written caption" },
  { actionKey: "ai.script.generate", credits: 4, estCostUsd: 0.015, description: "Generate a full short-form script in the user's voice" },
  { actionKey: "ai.calendar.month.generate", credits: 15, estCostUsd: 0.08, description: "Generate a month of post ideas mapped to the queue" },
  { actionKey: "ai.reply.draft", credits: 1, estCostUsd: 0.003, description: "Draft an inbox reply using brand voice" },
  { actionKey: "ai.translate", credits: 1, estCostUsd: 0.002, description: "Translate a caption or script (cheap model)" },

  // Media generation — image (cheap), video/voice (expensive: hold to 3x floor)
  { actionKey: "higgsfield.image.generate", credits: 5, estCostUsd: 0.03, description: "Generate one image" },
  { actionKey: "higgsfield.image.upscale", credits: 3, estCostUsd: 0.02, description: "Upscale an image to 2K/4K" },
  { actionKey: "higgsfield.image.outpaint", credits: 5, estCostUsd: 0.03, description: "Uncrop / expand an image" },
  { actionKey: "higgsfield.image.remove_bg", credits: 2, estCostUsd: 0.01, description: "Remove background" },
  { actionKey: "higgsfield.video.generate", credits: 55, estCostUsd: 0.35, description: "Generate a short video clip" },
  { actionKey: "higgsfield.video.upscale", credits: 40, estCostUsd: 0.25, description: "Upscale a video" },
  { actionKey: "higgsfield.video.reframe", credits: 15, estCostUsd: 0.10, description: "Reframe a video's aspect ratio" },
  { actionKey: "higgsfield.voice.generate", credits: 12, estCostUsd: 0.08, description: "Generate a voiceover" },
  { actionKey: "higgsfield.voice.clone", credits: 75, estCostUsd: 0.50, description: "Create a cloned voice (one-time)" },
  { actionKey: "higgsfield.dub", credits: 30, estCostUsd: 0.20, description: "Dub a video into another language" },
  { actionKey: "higgsfield.3d.generate", credits: 45, estCostUsd: 0.30, description: "Generate a 3D asset from an image" },

  // Long-form repurposing — heaviest compute in the product; strict 3x floor
  { actionKey: "cloneviral.long_to_shorts.render", credits: 110, estCostUsd: 0.70, description: "Turn a long video into vertical shorts" },
  { actionKey: "cloneviral.video.analyze", credits: 15, estCostUsd: 0.10, description: "Analyze a video for high-virality clips" },
  { actionKey: "cloneviral.translate", credits: 60, estCostUsd: 0.40, description: "Translate a video (audio + subtitles)" },

  // Automation baseline free; individual actions inside still debit their own cost.
  { actionKey: "automation.tick", credits: 0, estCostUsd: 0, description: "Evaluating an enabled automation (free tick)" },

  // Trends baseline free (cached daily snapshot); premium detail view costs
  { actionKey: "trend.snapshot", credits: 0, estCostUsd: 0, description: "Daily trend snapshot (free)" },
  { actionKey: "trend.detail_view", credits: 2, estCostUsd: 0.01, description: "Deep view of a competitor / trending post" },
];

/** Fast lookup used by `withCredits`. */
export const CREDIT_PRICE_MAP: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(CREDIT_PRICE_SEED.map((p) => [p.actionKey, p.credits])),
);

/**
 * Dev-time sanity check — throws if any priced action falls under the margin
 * floor. Default is 1.9x (not 3x) because `zernio.post.*` actions are
 * deliberately thin-margin, high-frequency actions carried by the base
 * subscription fee rather than the credit itself — see file header.
 */
export function assertMinimumMargins(minMultiple = 1.9) {
  const offenders = CREDIT_PRICE_SEED.filter(
    (p) => p.estCostUsd > 0 && p.credits * RETAIL_USD_PER_CREDIT < p.estCostUsd * minMultiple,
  );
  if (offenders.length) {
    throw new Error(
      `Credit prices below margin floor: ${offenders.map((o) => o.actionKey).join(", ")}`,
    );
  }
}
