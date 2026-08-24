"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { writeLedger } from "@/lib/credits";
import { db } from "@/db";
import { auditEvents, organizations, socialConnections } from "@/db/schema";
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

/**
 * Deletes the row rather than just marking it revoked — the tokens are
 * dead either way once disconnected here, so there's nothing left worth
 * keeping encrypted at rest. The audit_events row is the permanent record
 * that this happened, not the connection row itself.
 */
export async function disconnectSocialConnection(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const connectionId = String(formData.get("connectionId"));

  const [conn] = await db
    .select({ platform: socialConnections.platform, providerAccountId: socialConnections.providerAccountId })
    .from(socialConnections)
    .where(eq(socialConnections.id, connectionId));

  await db.delete(socialConnections).where(eq(socialConnections.id, connectionId));

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.connection.disconnect",
    entityType: "social_connection",
    entityId: connectionId,
    payload: conn ?? null,
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}
