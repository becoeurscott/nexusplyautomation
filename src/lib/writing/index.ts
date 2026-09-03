import { withCredits } from "@/lib/credits";
import { chat, loadBrandContext } from "@/lib/ai";
import { asStringArray, parseJsonReply } from "@/lib/ai/json";
import { friendlyError } from "@/lib/user-message";
import { TrialExpiredError } from "@/lib/billing/trial";

/**
 * The writing tools: ideas, captions, rewrites, long-form posts, carousels.
 *
 * Every one of these was already priced in `credit_prices` and advertised in
 * the activities catalogue before any of them existed. This is that promise
 * being met, so the prices and action keys here are the ones already seeded —
 * nothing is re-priced.
 *
 * Keyed on `orgId` like `@/lib/scoring`, for the same reason: these need to be
 * callable from a session-authenticated server action today and from the
 * extension's bearer-token route tomorrow, without a second copy of the prompt.
 *
 * Text-returning helpers do NOT ask for JSON — a caption is prose, and wrapping
 * it in JSON only adds a parse step that can fail. Only the two that genuinely
 * return a list (ideas, carousel slides) use JSON, and both parse defensively
 * because the credit is spent before the reply is read.
 */

export type TextResult = { ok: true; text: string } | { ok: false; error: string };
export type ListResult = { ok: true; items: string[] } | { ok: false; error: string };

const MIN_BRIEF = 3;

/** Strips fences/quotes a model sometimes wraps prose in despite being asked not to. */
function cleanProse(raw: string): string {
  let s = raw.trim();
  const fenced = s.match(/^```(?:\w+)?\s*([\s\S]*?)```$/);
  if (fenced?.[1]) s = fenced[1].trim();
  // A whole reply wrapped in quotes — but not a caption that merely contains
  // quoted speech, hence anchoring to both ends and requiring no inner quote.
  const quoted = s.match(/^"([^"]*)"$/);
  if (quoted?.[1]) s = quoted[1].trim();
  return s;
}

async function runText(
  orgId: string,
  action: string,
  task: Parameters<typeof chat>[0]["task"],
  system: string,
  user: string,
  actorUserId?: string,
  temperature = 0.8,
): Promise<TextResult> {
  try {
    const brand = await loadBrandContext(orgId);
    const { result } = await withCredits({ orgId, action, actorUserId }, () =>
      chat({
        task,
        system: brand ? `${brand}\n\n${system}` : system,
        user,
        temperature,
      }),
    );
    const text = cleanProse(result);
    if (!text) {
      return { ok: false, error: "We got an empty reply. Please try again." };
    }
    return { ok: true, text };
  } catch (e) {
    if (e instanceof TrialExpiredError) return { ok: false, error: e.message };
    return { ok: false, error: friendlyError(e, action) };
  }
}

async function runList(
  orgId: string,
  action: string,
  task: Parameters<typeof chat>[0]["task"],
  system: string,
  user: string,
  key: string,
  limit: number,
  actorUserId?: string,
): Promise<ListResult> {
  let raw: string;
  try {
    const brand = await loadBrandContext(orgId);
    const { result } = await withCredits({ orgId, action, actorUserId }, () =>
      chat({
        task,
        system: brand ? `${brand}\n\n${system}` : system,
        user,
        json: true,
        temperature: 0.8,
      }),
    );
    raw = result;
  } catch (e) {
    if (e instanceof TrialExpiredError) return { ok: false, error: e.message };
    return { ok: false, error: friendlyError(e, action) };
  }

  const parsed = parseJsonReply(raw) as Record<string, unknown> | null;
  const items = parsed ? asStringArray(parsed[key], limit) : [];
  if (items.length === 0) {
    return { ok: false, error: "We couldn't read that back. Please try again." };
  }
  return { ok: true, items };
}

/* ── Ideas ────────────────────────────────────────────────────────────────── */

export async function generateIdeas(
  orgId: string,
  brief: string,
  actorUserId?: string,
): Promise<ListResult> {
  if (brief.trim().length < MIN_BRIEF) {
    return { ok: false, error: "Tell us roughly what the business does first." };
  }
  return runList(
    orgId,
    "ai.idea.generate",
    "idea.generate",
    `You suggest social media post ideas for a business.

Reply with ONLY a JSON object: {"ideas": ["<idea>", "<idea>", "<idea>", "<idea>", "<idea>"]}

Each idea is one sentence describing what the post would be about — not the caption itself. Make them specific to this business and varied: something useful, something behind-the-scenes, something about an offer, something a customer asked. Never invent facts about the business.`,
    brief.trim(),
    "ideas",
    5,
    actorUserId,
  );
}

/* ── Captions ─────────────────────────────────────────────────────────────── */

export async function generateCaption(
  orgId: string,
  brief: string,
  actorUserId?: string,
): Promise<TextResult> {
  if (brief.trim().length < MIN_BRIEF) {
    return { ok: false, error: "Tell us what the post should be about first." };
  }
  return runText(
    orgId,
    "ai.caption.generate",
    "caption.generate",
    `You write social media captions.

Reply with ONLY the caption text — no preamble, no quotes around it, no markdown, no explanation.

Open with something that earns the next line. Keep it to a length that suits social media. End with a clear next step if one makes sense. Never invent facts, prices, dates or claims about the business that you weren't given.`,
    brief.trim(),
    actorUserId,
  );
}

export async function rewriteCaption(
  orgId: string,
  text: string,
  direction: string,
  actorUserId?: string,
): Promise<TextResult> {
  if (text.trim().length < 10) {
    return { ok: false, error: "Write a bit more first, then we can rewrite it." };
  }
  const how = direction.trim() || "Same message, sharper and easier to read.";
  return runText(
    orgId,
    "ai.caption.polish",
    "caption.polish",
    `You rewrite social media captions.

Reply with ONLY the rewritten caption — no preamble, no quotes around it, no explanation.

Keep the author's meaning and every fact exactly as given. Do not add claims, offers or details that aren't in the original.

How to rewrite it: ${how}`,
    text.trim(),
    actorUserId,
    0.7,
  );
}

/* ── Long form ────────────────────────────────────────────────────────────── */

export async function generateLongForm(
  orgId: string,
  brief: string,
  actorUserId?: string,
): Promise<TextResult> {
  if (brief.trim().length < MIN_BRIEF) {
    return { ok: false, error: "Tell us what the post should be about first." };
  }
  return runText(
    orgId,
    "ai.post.long_form",
    "post.long_form",
    `You write longer social media posts — the kind that suit LinkedIn, Facebook, or a newsletter-style update.

Reply with ONLY the post text — no preamble, no title, no markdown headings, no explanation.

Structure it in short paragraphs with line breaks, the way people actually read on a phone. Open with a line worth stopping for and close with a clear takeaway or next step. Never invent facts about the business.`,
    brief.trim(),
    actorUserId,
  );
}

/* ── Carousel ─────────────────────────────────────────────────────────────── */

export async function generateCarousel(
  orgId: string,
  brief: string,
  actorUserId?: string,
): Promise<ListResult> {
  if (brief.trim().length < MIN_BRIEF) {
    return { ok: false, error: "Tell us what the carousel should be about first." };
  }
  return runList(
    orgId,
    "ai.carousel.copy",
    "carousel.copy",
    `You write copy for multi-slide social media carousels.

Reply with ONLY a JSON object: {"slides": ["<slide 1>", "<slide 2>", ...]}

Give 5 to 7 slides. Slide 1 is the hook that makes someone swipe. The middle slides each make one point, short enough to read at a glance. The last slide is the call to action. Never invent facts about the business.`,
    brief.trim(),
    "slides",
    8,
    actorUserId,
  );
}
