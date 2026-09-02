"use server";

import { requireWorkspace } from "@/lib/workspace";
import { withCredits } from "@/lib/credits";
import { chat, loadBrandContext } from "@/lib/ai";
import { asStringArray, clampScore, parseJsonReply } from "@/lib/ai/json";
import { friendlyError } from "@/lib/user-message";
import { TrialExpiredError } from "@/lib/billing/trial";

/**
 * Scoring and hashtag suggestions for a draft, before it is published.
 *
 * Both run on the fast model tier and cost 1 credit each, because they are
 * meant to be pressed repeatedly while someone edits — see the pricing note
 * in `src/lib/credits/prices.ts`.
 *
 * The model is asked for JSON (`json: true`) but the reply is still parsed
 * defensively: the request only raises the odds of valid JSON, it does not
 * guarantee it. A malformed reply returns a plain message rather than throwing
 * — the credit was already spent by then, and `withCredits` only refunds on a
 * thrown error, so a crash here would cost the customer a credit AND show them
 * a stack trace.
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

const SCORE_SYSTEM = `You are a social media strategist reviewing a draft post before it is published.

Score the post out of 100 on how likely it is to stop the scroll and get engagement on the platforms named.

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

export async function scorePost(content: string): Promise<ScoreResult> {
  const trimmed = content.trim();
  if (trimmed.length < 10) {
    return { ok: false, error: "Write a bit more first, then we can score it." };
  }

  const { workspace, session } = await requireWorkspace();

  let raw: string;
  try {
    const brand = await loadBrandContext(workspace.id);
    const { result } = await withCredits(
      {
        orgId: workspace.id,
        action: "ai.content.score",
        actorUserId: session.user.id,
      },
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
    | {
        score?: unknown;
        summary?: unknown;
        factors?: unknown;
        fixes?: unknown;
      }
    | null;

  if (!parsed || parsed.score === undefined) {
    // The credit is already spent and the call itself succeeded, so this is a
    // "try again" rather than an error worth alarming anyone about.
    return {
      ok: false,
      error: "We couldn't read that score back. Please try again.",
    };
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

export async function suggestHashtags(content: string): Promise<HashtagResult> {
  const trimmed = content.trim();
  if (trimmed.length < 10) {
    return { ok: false, error: "Write a bit more first, then we can suggest tags." };
  }

  const { workspace, session } = await requireWorkspace();

  let raw: string;
  try {
    const brand = await loadBrandContext(workspace.id);
    const { result } = await withCredits(
      {
        orgId: workspace.id,
        action: "ai.hashtags.generate",
        actorUserId: session.user.id,
      },
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

  return {
    ok: true,
    hashtags,
    keywords: asStringArray(parsed.keywords, 8),
  };
}
