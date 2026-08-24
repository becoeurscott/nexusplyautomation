"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { platformLabel } from "./_components/platform-badge";

const SUPPORT_EMAIL = "hello@nexusply.ai";

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

export type ConnectRequestState =
  | {
      ok: true;
      message: string;
      /** Client opens this to hand the request to a human — see the comment below. */
      mailto: string;
    }
  | { ok: false; message: string }
  | null;

/**
 * Records a request to connect a social account and hands it to a human.
 *
 * There is no OAuth connect flow yet — accounts are linked on the operator's
 * side against the platform-wide Zernio key (see src/lib/zernio/for-workspace.ts),
 * and no automated email is configured (RESEND_API_KEY is unset). Faking a
 * "Connected!" success state here would lie about what just happened. Instead
 * this does two real things: writes an audit trail entry so the request is
 * never lost even if the email doesn't land, and opens the customer's own
 * mail client pre-addressed to support so the request reaches a person.
 */
export async function requestAccountConnection(
  _prev: ConnectRequestState,
  formData: FormData,
): Promise<ConnectRequestState> {
  const { workspace, session } = await requireWorkspace();
  const platform = String(formData.get("platform") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!platform) {
    return { ok: false, message: "Choose a platform first." };
  }

  await db.insert(auditEvents).values({
    orgId: workspace.id,
    actorUserId: session.user.id,
    action: "account.connect_requested",
    entityType: "account",
    payload: { platform, handle: handle || null },
    result: "ok",
  });

  const label = platformLabel(platform);
  const subject = `Connect ${label} — ${workspace.name}`;
  const body = [
    `Workspace: ${workspace.name} (${workspace.id})`,
    `Platform: ${label}`,
    handle ? `Handle / page: ${handle}` : null,
    `Requested by: ${session.user.email}`,
  ]
    .filter(Boolean)
    .join("\n");
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  revalidatePath("/app/accounts");
  revalidatePath("/app/settings");

  return {
    ok: true,
    message: `Request sent — we'll connect your ${label} account shortly.`,
    mailto,
  };
}
