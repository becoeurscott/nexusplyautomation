import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { brandExamples, brandProfiles } from "@/db/schema";

/**
 * Loads the org's default brand profile + recent examples, and returns a
 * ready-to-inject system-prompt fragment. Callers concatenate this in front
 * of their task-specific system prompt before hitting `chat()`.
 *
 * v1 uses recency (last-N examples). Semantic (pgvector) retrieval lands with
 * the trend/AI phase — the schema already has the `embedding` column.
 */
export async function loadBrandContext(orgId: string, opts?: {
  brandProfileId?: string;
  maxExamples?: number;
}): Promise<string> {
  const filter = opts?.brandProfileId
    ? and(
        eq(brandProfiles.orgId, orgId),
        eq(brandProfiles.id, opts.brandProfileId),
      )
    : and(
        eq(brandProfiles.orgId, orgId),
        eq(brandProfiles.isDefault, true),
      );

  const [profile] = await db.select().from(brandProfiles).where(filter).limit(1);
  if (!profile) return "";

  const examples = await db
    .select({ content: brandExamples.content, kind: brandExamples.kind })
    .from(brandExamples)
    .where(eq(brandExamples.brandProfileId, profile.id))
    .limit(opts?.maxExamples ?? 5);

  const lines = [
    "You are writing on behalf of the following brand. Match its voice exactly.",
    `- Brand name: ${profile.name}`,
    profile.niche && `- Niche: ${profile.niche}`,
    profile.audience && `- Audience: ${profile.audience}`,
    profile.toneWords.length && `- Tone: ${profile.toneWords.join(", ")}`,
    profile.forbiddenWords.length && `- NEVER use: ${profile.forbiddenWords.join(", ")}`,
    profile.voiceNotes && `- Voice notes: ${profile.voiceNotes}`,
    profile.topHashtags.length && `- Preferred hashtags: ${profile.topHashtags.join(" ")}`,
    examples.length && "\nExamples of the brand's own voice:",
    ...examples.map((e, i) => `Example ${i + 1} (${e.kind}):\n"""${e.content}"""`),
  ].filter(Boolean);

  return lines.join("\n");
}
