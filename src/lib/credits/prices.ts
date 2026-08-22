/**
 * Seed table for `credit_prices`. Hot-editable in admin; this file is
 * the initial-load source that runs on `pnpm db:push` or a first-boot script.
 *
 * Actions are namespaced by producer: `zernio.*`, `higgsfield.*`, `cloneviral.*`,
 * `ai.*`, `automation.*`, `trend.*`.
 *
 * Cost calibration principle: 1 credit ≈ USD $0.01 of underlying provider spend,
 * with a 2–3× markup baked in so the Starter (30 free credits) covers ~1 week
 * of casual use and the School plan (300) covers a school's monthly cadence.
 */

export type CreditPriceSeed = {
  actionKey: string;
  credits: number;
  description: string;
};

export const CREDIT_PRICE_SEED: CreditPriceSeed[] = [
  // Zernio (publishing / inbox / analytics)
  { actionKey: "zernio.post.create", credits: 1, description: "Schedule or publish one post to one account" },
  { actionKey: "zernio.post.cross_extra_account", credits: 1, description: "Extra account when cross-posting (per additional account)" },
  { actionKey: "zernio.post.edit", credits: 0, description: "Edit an already-scheduled post (free)" },
  { actionKey: "zernio.post.retry", credits: 0, description: "Retry a failed post (free — original debit stands or was refunded)" },
  { actionKey: "zernio.inbox.reply", credits: 0, description: "Reply to a comment or mention (free)" },
  { actionKey: "zernio.analytics.refresh", credits: 0, description: "Manual analytics refresh (free)" },

  // AI (Claude for hard, Gemini Flash / DeepSeek for cheap — see packages/ai)
  { actionKey: "ai.caption.generate", credits: 3, description: "Generate one platform-specific caption" },
  { actionKey: "ai.caption.polish", credits: 1, description: "Cheap-model polish of a user-written caption" },
  { actionKey: "ai.script.generate", credits: 5, description: "Generate a full short-form script in the user's voice" },
  { actionKey: "ai.calendar.month.generate", credits: 15, description: "Generate a month of post ideas mapped to the queue" },
  { actionKey: "ai.reply.draft", credits: 2, description: "Draft an inbox reply using brand voice" },
  { actionKey: "ai.translate", credits: 1, description: "Translate a caption or script (cheap model)" },

  // Higgsfield (media generation)
  { actionKey: "higgsfield.image.generate", credits: 2, description: "Generate one image" },
  { actionKey: "higgsfield.image.upscale", credits: 3, description: "Upscale an image to 2K/4K" },
  { actionKey: "higgsfield.image.outpaint", credits: 3, description: "Uncrop / expand an image" },
  { actionKey: "higgsfield.image.remove_bg", credits: 1, description: "Remove background" },
  { actionKey: "higgsfield.video.generate", credits: 20, description: "Generate a short video clip" },
  { actionKey: "higgsfield.video.upscale", credits: 15, description: "Upscale a video" },
  { actionKey: "higgsfield.video.reframe", credits: 5, description: "Reframe a video's aspect ratio" },
  { actionKey: "higgsfield.voice.generate", credits: 5, description: "Generate a voiceover" },
  { actionKey: "higgsfield.voice.clone", credits: 30, description: "Create a cloned voice (one-time)" },
  { actionKey: "higgsfield.dub", credits: 10, description: "Dub a video into another language" },
  { actionKey: "higgsfield.3d.generate", credits: 15, description: "Generate a 3D asset from an image" },

  // CloneViral (long-form → shorts)
  { actionKey: "cloneviral.long_to_shorts.render", credits: 25, description: "Turn a long video into vertical shorts" },
  { actionKey: "cloneviral.video.analyze", credits: 5, description: "Analyze a video for high-virality clips" },
  { actionKey: "cloneviral.translate", credits: 15, description: "Translate a video (audio + subtitles)" },

  // Automation baseline free; individual actions inside still debit.
  { actionKey: "automation.tick", credits: 0, description: "Evaluating an enabled automation (free tick)" },

  // Trends baseline free; premium detail view costs
  { actionKey: "trend.snapshot", credits: 0, description: "Daily trend snapshot (free)" },
  { actionKey: "trend.detail_view", credits: 2, description: "Deep view of a competitor / trending post" },
];

/** Fast lookup used by `withCredits`. */
export const CREDIT_PRICE_MAP: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(CREDIT_PRICE_SEED.map((p) => [p.actionKey, p.credits])),
);
