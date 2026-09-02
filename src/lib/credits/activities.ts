import { CREDIT_PRICE_MAP, VIDEO_BASE_SECONDS, VIDEO_CREDITS_PER_EXTRA_SECOND } from "./prices";

/**
 * What customers see when they spend credits.
 *
 * `prices.ts` is the billing ledger's view — one row per metered action, keyed
 * for accounting. This is the product's view: things a business owner would
 * actually say they want to do. "Create a week of content" reads like a tool;
 * "ai.calendar.month.generate at 10 credits" reads like a token meter.
 *
 * Every cost here is looked up from `CREDIT_PRICE_MAP` rather than restated, so
 * the price a customer is quoted and the price they are charged cannot drift
 * apart. This is the only place credit copy for the UI lives.
 */

export type Activity = {
  key: string;
  label: string;
  /** Plain-language description; safe to render directly. */
  blurb: string;
  credits: number;
  group: "write" | "visual" | "video" | "plan" | "publish" | "insight";
};

function priceOf(actionKey: string): number {
  const credits = CREDIT_PRICE_MAP[actionKey];
  if (credits === undefined) {
    throw new Error(`No credit price seeded for "${actionKey}"`);
  }
  return credits;
}

export const ACTIVITIES: Activity[] = [
  {
    key: "post.write",
    label: "Write a post",
    blurb: "A caption in your brand voice, ready to publish.",
    credits: priceOf("ai.caption.generate"),
    group: "write",
  },
  {
    key: "post.ideas",
    label: "Get a post idea",
    blurb: "Something to say when you're staring at a blank calendar.",
    credits: priceOf("ai.idea.generate"),
    group: "write",
  },
  {
    key: "post.hashtags",
    label: "Suggest hashtags",
    blurb: "A tag set matched to the post and your audience.",
    credits: priceOf("ai.hashtags.generate"),
    group: "write",
  },
  {
    key: "post.rewrite",
    label: "Rewrite a post",
    blurb: "Same message, different angle or tone.",
    credits: priceOf("ai.caption.polish"),
    group: "write",
  },
  {
    key: "post.long",
    label: "Write a long-form post",
    blurb: "For LinkedIn, Facebook, or a newsletter-style update.",
    credits: priceOf("ai.post.long_form"),
    group: "write",
  },
  {
    key: "post.carousel",
    label: "Write a carousel",
    blurb: "Slide-by-slide copy for a multi-image post.",
    credits: priceOf("ai.carousel.copy"),
    group: "write",
  },
  {
    key: "image.create",
    label: "Create an image",
    blurb: "A social-ready visual from a description.",
    credits: priceOf("media.image.generate"),
    group: "visual",
  },
  {
    key: "image.premium",
    label: "Create a premium image",
    blurb: "Higher-detail visual for campaigns and ads.",
    credits: priceOf("media.image.premium"),
    group: "visual",
  },
  {
    key: "image.edit",
    label: "Edit an image",
    blurb: "Change or extend an image you already have.",
    credits: priceOf("media.image.edit"),
    group: "visual",
  },
  {
    key: "video.short",
    label: `Create a short video (${VIDEO_BASE_SECONDS}s)`,
    blurb: `A ${VIDEO_BASE_SECONDS}-second clip for a hook or a loop. Longer clips cost ${VIDEO_CREDITS_PER_EXTRA_SECOND} credits per extra second.`,
    credits: priceOf("media.video.generate"),
    group: "video",
  },
  {
    key: "post.score",
    label: "Score a post",
    blurb: "See how strong a post is — and what to fix — before it goes out.",
    credits: priceOf("ai.content.score"),
    group: "insight",
  },
  {
    key: "video.analyze",
    label: "Analyse a video",
    blurb: "Find the strongest moments in a video you already have.",
    credits: priceOf("cloneviral.video.analyze"),
    group: "insight",
  },
  {
    key: "strategy.brand_voice",
    label: "Analyse your brand voice",
    blurb: "Teaches NexusPly how your business sounds.",
    credits: priceOf("ai.brand_voice.analyze"),
    group: "plan",
  },
  {
    key: "strategy.month",
    label: "Build a content strategy",
    blurb: "A month of direction built around your offers.",
    credits: priceOf("ai.calendar.month.generate"),
    group: "plan",
  },
  {
    key: "publish.post",
    label: "Publish or schedule a post",
    blurb: "Send it out now, or pick a time.",
    credits: priceOf("zernio.post.create"),
    group: "publish",
  },
];

export type Bundle = {
  key: string;
  label: string;
  cta: string;
  credits: number;
  includes: string[];
};

/**
 * The headline offer. Generating thirty things one at a time is work; pressing
 * "Generate my month" is a product.
 */
export const BUNDLES: Bundle[] = [
  {
    key: "bundle.week",
    label: "7-Day Content Pack",
    cta: "Generate my week",
    credits: priceOf("bundle.week.generate"),
    includes: [
      "7 post ideas",
      "7 captions written in your voice",
      "7 visual concepts",
      "A publishing schedule",
    ],
  },
  {
    key: "bundle.month",
    label: "30-Day Content Pack",
    cta: "Generate my month",
    credits: priceOf("bundle.month.generate"),
    includes: [
      "30 content ideas",
      "30 captions",
      "Visual concepts for each",
      "A full publishing calendar",
      "Hashtag suggestions",
    ],
  },
];

/** Credits for a video of `seconds` length, billed beyond the base clip. */
export function videoCredits(seconds: number): number {
  const base = priceOf("media.video.generate");
  const extra = Math.max(0, Math.ceil(seconds) - VIDEO_BASE_SECONDS);
  return base + extra * VIDEO_CREDITS_PER_EXTRA_SECOND;
}
