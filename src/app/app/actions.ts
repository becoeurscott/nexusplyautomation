"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";

export type ActionState = { ok: boolean; message: string } | null;

/**
 * Retries every post that failed to go out. Surfaced straight on the dashboard
 * so a failure is something you can fix where you see it, rather than a dead
 * status you have to go hunting for.
 */
export async function retryFailedPosts(): Promise<ActionState> {
  const { workspace, session } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  if (!client) {
    return { ok: false, message: "Your account isn't set up for posting yet." };
  }

  try {
    await client.posts.retryAllFailed();
  } catch (e) {
    await db.insert(auditEvents).values({
      orgId: workspace.id,
      actorUserId: session.user.id,
      action: "post.retry_all_failed",
      entityType: "post",
      result: "error",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, message: friendlyError(e, "posts.retryAllFailed") };
  }

  await db.insert(auditEvents).values({
    orgId: workspace.id,
    actorUserId: session.user.id,
    action: "post.retry_all_failed",
    entityType: "post",
    result: "ok",
  });

  revalidatePath("/app");
  revalidatePath("/app/posts");
  return { ok: true, message: "We're trying those posts again." };
}
