import { withCredits } from "@/lib/credits";
import { chat, loadBrandContext } from "@/lib/ai";
import { asStringArray, clampScore, parseJsonReply } from "@/lib/ai/json";
import { friendlyError } from "@/lib/user-message";
import { TrialExpiredError } from "@/lib/billing/trial";

/**
 * Scoring a draft, and suggesting tags for it.
 *
 * Keyed on `orgId` rather than a session, because this runs from two entry
 * points: the Compose server action (session cookie) and the browser
 * extension's REST route (bearer token). They authenticate differently but must
 * behave identically — a second copy of the prompt or the credit call would
 * eventually give two different answers for the same post.
 *
 * The model is asked for JSON, and the reply is still parsed defensively: the
 * request is a hint, not a contract, and a parse failure lands *after* the
 * credit is spent. Failing loudly there would charge the customer and show them
 * a crash, so these return a message instead.
 */

export type ScoreFactor = {
  /** Short label, e.g. "Hook" or "Call to action". */
  label: string;
  /** 0-100 for this dimension. */
  score: number;
  /** One sentence on why it scored that. */
  note: string;
};

export type ScoreResult =
  | {
      ok: true;
      score: number;
      summary: string;
      factors: ScoreFactor[];
      fixes: string[];
    }
  | { ok: false; error: string };

export type HashtagResult =
  | { ok: true; hashtags: string[]; keywords: string[] }
  | { ok: false; error: string };

const MIN_LENGTH = 10;

const SCORE_SYSTEM = `You are a social media strategist reviewing a draft post before it is published.

Score the post out of 100 on how likely it is to stop the scroll and get engagement.

Reply with ONLY a JSON object, no prose and no markdown fences, in exactly this shape:
{
  "score": <integer 0-100>,
  "summary": "<one sentence verdict, max 140 characters>",
  "factors": [
    { "label": "Hook", "score": <0-100>, "note": "<one short sentence>" },
    { "label": "Clarity", "score": <0-100>, "note": "<one short sentence>" },
    { "label": "Call to action", "score": <0-100>, "note": "<one short sentence>" },
    { "label": "Length", "score": <0-100>, "note": "<one short sentence>" }
  ],
  "fixes": ["<specific, actionable change>", "<another>", "<another>"]
}

Be honest and specific. "Add a stronger hook" is useless; "Open with the question in line 3 instead of the greeting" is useful. Never invent facts about the business.`;

const HASHTAG_SYSTEM = `You suggest hashtags and keywords for a social media post.

Reply with ONLY a JSON object, no prose and no markdown fences, in exactly this shape:
{
  "hashtags": ["#example", "#another"],
  "keywords": ["search term", "another term"]
}

Give 8-15 hashtags mixing broad reach and specific niche tags, each starting with "#". Give 5-8 keywords a person might actually search to find this content. No duplicates, no banned or spammy tags, and never pad the list to hit a number.`;

export async function scoreContent(
  orgId: string,
  content: string,
  actorUserId?: string,
): Promise<ScoreResult> {
  const trimmed = content.trim();
  if (trimmed.length < MIN_LENGTH) {
    return { ok: false, error: "Write a bit more first, then we can score it." };
  }

  let raw: string;
  try {
    const brand = await loadBrandContext(orgId);
    const { result } = await withCredits(
      { orgId, action: "ai.content.score", actorUserId },
      () =>
        chat({
          task: "content.score",
          system: brand ? `${brand}\n\n${SCORE_SYSTEM}` : SCORE_SYSTEM,
          user: trimmed,
          json: true,
          temperature: 0.3,
        }),
    );
    raw = result;
  } catch (e) {
    if (e instanceof TrialExpiredError) return { ok: false, error: e.message };
    return { ok: false, error: friendlyError(e, "content.score") };
  }

  const parsed = parseJsonReply(raw) as
    | { score?: unknown; summary?: unknown; factors?: unknown; fixes?: unknown }
    | null;

  if (!parsed || parsed.score === undefined) {
    // The call itself succeeded and the credit is spent, so this is a "try
    // again", not an outage worth alarming anyone about.
    return { ok: false, error: "We couldn't read that score back. Please try again." };
  }

  const factors: ScoreFactor[] = Array.isArray(parsed.factors)
    ? parsed.factors
        .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
        .map((f) => ({
          label: typeof f.label === "string" ? f.label : "Factor",
          score: clampScore(f.score),
          note: typeof f.note === "string" ? f.note : "",
        }))
        .slice(0, 6)
    : [];

  return {
    ok: true,
    score: clampScore(parsed.score),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    factors,
    fixes: asStringArray(parsed.fixes, 5),
  };
}

export async function suggestHashtagsFor(
  orgId: string,
  content: string,
  actorUserId?: string,
): Promise<HashtagResult> {
  const trimmed = content.trim();
  if (trimmed.length < MIN_LENGTH) {
    return { ok: false, error: "Write a bit more first, then we can suggest tags." };
  }

  let raw: string;
  try {
    const brand = await loadBrandContext(orgId);
    const { result } = await withCredits(
      { orgId, action: "ai.hashtags.generate", actorUserId },
      () =>
        chat({
          task: "hashtags.generate",
          system: brand ? `${brand}\n\n${HASHTAG_SYSTEM}` : HASHTAG_SYSTEM,
          user: trimmed,
          json: true,
          temperature: 0.5,
        }),
    );
    raw = result;
  } catch (e) {
    if (e instanceof TrialExpiredError) return { ok: false, error: e.message };
    return { ok: false, error: friendlyError(e, "hashtags.generate") };
  }

  const parsed = parseJsonReply(raw) as
    | { hashtags?: unknown; keywords?: unknown }
    | null;

  if (!parsed) {
    return {
      ok: false,
      error: "We couldn't read those suggestions back. Please try again.",
    };
  }

  const hashtags = asStringArray(parsed.hashtags, 15).map((h) =>
    h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`,
  );

  return { ok: true, hashtags, keywords: asStringArray(parsed.keywords, 8) };
}
