"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { writeLedger } from "@/lib/credits";
import { db } from "@/db";
import { auditEvents, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function adjustCredits(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error("Enter a non-zero whole number of credits.");
  }

  await writeLedger({
    orgId,
    delta: Math.trunc(delta),
    reason: "admin_adjust",
    actorUserId: session.user.id,
    note: note ?? undefined,
  });

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.credits.adjust",
    entityType: "organization",
    entityId: orgId,
    payload: { delta: Math.trunc(delta), note },
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}

export async function toggleOnboarded(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const nextValue = formData.get("nextValue") === "true";

  await db
    .update(organizations)
    .set({ onboardingCompletedAt: nextValue ? new Date() : null })
    .where(eq(organizations.id, orgId));

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.org.toggle_onboarded",
    entityType: "organization",
    entityId: orgId,
    payload: { nextValue },
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}
