"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { auditEvents, featureFlags } from "@/db/schema";

export async function toggleFlag(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const key = String(formData.get("key"));
  const nextValue = formData.get("nextValue") === "true";

  await db
    .update(featureFlags)
    .set({ value: nextValue, updatedAt: new Date() })
    .where(sql`${featureFlags.key} = ${key}`);

  await db.insert(auditEvents).values({
    actorUserId: session.user.id,
    action: "admin.flag.toggle",
    entityType: "feature_flag",
    entityId: key,
    payload: { nextValue },
    result: "ok",
  });

  revalidatePath("/admin/flags");
}

export async function createFlag(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const key = String(formData.get("key") ?? "").trim();
  if (!key) throw new Error("Key is required.");

  await db
    .insert(featureFlags)
    .values({ key, value: false })
    .onConflictDoNothing({ target: featureFlags.key });

  await db.insert(auditEvents).values({
    actorUserId: session.user.id,
    action: "admin.flag.create",
    entityType: "feature_flag",
    entityId: key,
    result: "ok",
  });

  revalidatePath("/admin/flags");
}
