"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brandProfiles, organizations } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Step 1 — brand basics. Saved as the org's default brand profile. */
export async function saveBrandBasics(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const niche = String(formData.get("niche") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const toneRaw = String(formData.get("tone") ?? "").trim();
  const toneWords = toneRaw
    ? toneRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  await db
    .insert(brandProfiles)
    .values({
      orgId: workspace.id,
      name: workspace.name,
      niche: niche || null,
      audience: audience || null,
      toneWords,
      isDefault: true,
    })
    .onConflictDoNothing();

  return { ok: true };
}

/** Step 3 — finish (or skip from anywhere). Marks onboarding done and redirects. */
export async function finishOnboarding(): Promise<void> {
  const { workspace } = await requireWorkspace();
  await db
    .update(organizations)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(organizations.id, workspace.id));
  redirect("/app");
}
