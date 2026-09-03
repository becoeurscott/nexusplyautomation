import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { drafts } from "@/db/schema";
import { withCredits } from "@/lib/credits";
import { chat, loadBrandContext } from "@/lib/ai";
import { parseJsonReply } from "@/lib/ai/json";
import { friendlyError } from "@/lib/user-message";
import { TrialExpiredError } from "@/lib/billing/trial";

/**
 * Content packs — "Generate my week" and "Generate my month".
 *
 * This is the offer the landing page leads with, and it was priced
 * (`bundle.week.generate` 50cr, `bundle.month.generate` 200cr) and advertised
 * long before it existed. The credit costs here are the seeded ones; nothing is
 * re-priced.
 *
 * ── WHY IT GENERATES IN CHUNKS ───────────────────────────────────────────────
 *
 * Thirty days of ideas, captions, visual concepts and hashtags is far more
 * output than one completion reliably returns — it gets truncated mid-JSON, and
 * a truncated reply is a total loss because nothing parses. So a pack is built
 * in chunks of `CHUNK_DAYS` and stitched together. Each chunk is told what came
 * before so the month reads as a plan rather than ten unrelated ideas about the
 * same thing.
 *
 * The whole pack sits inside ONE `withCredits` call. If chunk three fails, the
 * customer is refunded the entire 200 credits rather than being charged in full
 * for two-thirds of a plan.
 *
 * Results are persisted to `drafts` (an existing, previously-unused table with
 * exactly the right shape: a jsonb payload and a title). At 200 credits a run,
 * losing the output to a page refresh would be an expensive way to learn that
 * we didn't save it.
 */

export type PackDay = {
  day: number;
  idea: string;
  caption: string;
  /** A description of the image to make — not an image. */
  visual: string;
  hashtags: string[];
  /** Suggested slot, e.g. "Tue 09:00". Advisory only. */
  slot: string;
};

export type Pack = {
  days: PackDay[];
  brief: string;
  generatedAt: string;
};

export type PackResult = { ok: true; id: string; pack: Pack } | { ok: false; error: string };

/** Days per completion. Small enough that the JSON reliably finishes. */
const CHUNK_DAYS = 7;

export type PackLength = 7 | 30;

const ACTION: Record<PackLength, string> = {
  7: "bundle.week.generate",
  30: "bundle.month.generate",
};

function systemFor(count: number, startDay: number, previousIdeas: string[]): string {
  return `You plan social media content for a business.

Produce ${count} days of content, numbered from day ${startDay}.

Reply with ONLY a JSON object in exactly this shape:
{
  "days": [
    {
      "day": ${startDay},
      "idea": "<one sentence: what this post is about>",
      "caption": "<the actual caption, ready to publish>",
      "visual": "<what the image or video should show, described so someone could make it>",
      "hashtags": ["#tag", "#tag"],
      "slot": "<suggested day and time, e.g. Tue 09:00>"
    }
  ]
}

Vary the mix across the days: useful advice, behind-the-scenes, an offer, social proof, a question to the audience. Do not repeat the same angle twice. Give 4-8 hashtags per day. Never invent facts, prices, dates, or claims about the business beyond what you are told.${
    previousIdeas.length
      ? `\n\nThese ideas are already used in earlier days — do not repeat them:\n${previousIdeas
          .map((i) => `- ${i}`)
          .join("\n")}`
      : ""
  }`;
}

function parseDays(raw: string): PackDay[] {
  const parsed = parseJsonReply(raw) as { days?: unknown } | null;
  if (!parsed || !Array.isArray(parsed.days)) return [];

  return parsed.days
    .filter((d): d is Record<string, unknown> => Boolean(d) && typeof d === "object")
    .map((d, i) => ({
      day: typeof d.day === "number" ? d.day : i + 1,
      idea: typeof d.idea === "string" ? d.idea : "",
      caption: typeof d.caption === "string" ? d.caption : "",
      visual: typeof d.visual === "string" ? d.visual : "",
      hashtags: Array.isArray(d.hashtags)
        ? d.hashtags
            .filter((h): h is string => typeof h === "string")
            .map((h) => (h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`))
            .slice(0, 8)
        : [],
      slot: typeof d.slot === "string" ? d.slot : "",
    }))
    // A day with no caption is not a usable day — dropping it is better than
    // showing an empty card the customer paid for.
    .filter((d) => d.caption.trim().length > 0);
}

export async function generatePack(
  orgId: string,
  authorId: string,
  length: PackLength,
  brief: string,
): Promise<PackResult> {
  const trimmed = brief.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: "Tell us what the business does first." };
  }

  let days: PackDay[];
  try {
    const brandContext = await loadBrandContext(orgId);

    const { result } = await withCredits(
      { orgId, action: ACTION[length], actorUserId: authorId },
      async () => {
        const collected: PackDay[] = [];

        for (let start = 1; start <= length; start += CHUNK_DAYS) {
          const count = Math.min(CHUNK_DAYS, length - start + 1);
          const system = systemFor(
            count,
            start,
            collected.map((d) => d.idea).filter(Boolean),
          );

          const reply = await chat({
            task: "pack.generate",
            system: brandContext ? `${brandContext}\n\n${system}` : system,
            user: trimmed,
            json: true,
            temperature: 0.85,
            maxTokens: 4_000,
          });

          const chunk = parseDays(reply);
          if (chunk.length === 0) {
            // Throwing rather than returning a partial pack: this is inside
            // withCredits, so it triggers the refund. A half-built month is not
            // worth 200 credits.
            throw new Error(
              `Pack generation returned nothing usable for days ${start}-${start + count - 1}`,
            );
          }
          collected.push(...chunk);
        }

        return collected;
      },
    );
    days = result;
  } catch (e) {
    if (e instanceof TrialExpiredError) return { ok: false, error: e.message };
    return { ok: false, error: friendlyError(e, `pack.generate.${length}`) };
  }

  // Renumber: the model is asked to number from a given day but doesn't always
  // comply, and the customer should see 1..N regardless of what it returned.
  days = days.map((d, i) => ({ ...d, day: i + 1 }));

  const pack: Pack = { days, brief: trimmed, generatedAt: new Date().toISOString() };

  const [row] = await db
    .insert(drafts)
    .values({
      orgId,
      authorId,
      title: `${length}-Day Content Pack`,
      payload: pack,
    })
    .returning({ id: drafts.id });

  return { ok: true, id: row.id, pack };
}

export type SavedPack = {
  id: string;
  title: string;
  createdAt: Date;
  days: number;
};

export async function listPacks(orgId: string): Promise<SavedPack[]> {
  const rows = await db
    .select({
      id: drafts.id,
      title: drafts.title,
      payload: drafts.payload,
      createdAt: drafts.createdAt,
    })
    .from(drafts)
    .where(eq(drafts.orgId, orgId))
    .orderBy(desc(drafts.createdAt))
    .limit(50);

  return rows.map((r) => {
    const p = r.payload as Partial<Pack> | null;
    return {
      id: r.id,
      title: r.title ?? "Content pack",
      createdAt: r.createdAt,
      days: Array.isArray(p?.days) ? p.days.length : 0,
    };
  });
}

/** Scoped by org — a draft id in a URL proves nothing about who owns it. */
export async function getPack(orgId: string, id: string): Promise<Pack | null> {
  const [row] = await db
    .select({ payload: drafts.payload })
    .from(drafts)
    .where(and(eq(drafts.id, id), eq(drafts.orgId, orgId)))
    .limit(1);

  if (!row) return null;
  const p = row.payload as Partial<Pack> | null;
  if (!p || !Array.isArray(p.days)) return null;
  return {
    days: p.days as PackDay[],
    brief: typeof p.brief === "string" ? p.brief : "",
    generatedAt: typeof p.generatedAt === "string" ? p.generatedAt : "",
  };
}

export async function deletePack(orgId: string, id: string): Promise<void> {
  await db.delete(drafts).where(and(eq(drafts.id, id), eq(drafts.orgId, orgId)));
}
