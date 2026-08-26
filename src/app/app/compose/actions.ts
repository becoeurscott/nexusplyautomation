"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { assertBillingActive, TrialExpiredError } from "@/lib/billing/trial";

const PostSchema = z.object({
  content: z.string().min(1, "Write something to post first").max(10_000),
  accountIds: z.array(z.string()).min(1, "Choose at least one account to post to"),
  when: z.enum(["now", "schedule"]),
  scheduledAt: z.string().optional(),
  mediaUrls: z.array(z.string().url()).default([]),
});

export type CreatePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createPost(
  _prev: CreatePostResult | null,
  formData: FormData,
): Promise<CreatePostResult> {
  const { workspace, session } = await requireWorkspace();

  try {
    await assertBillingActive(workspace.id);
  } catch (e) {
    if (e instanceof TrialExpiredError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  const client = await zernioForWorkspace(workspace.id);
  if (!client) {
    return {
      ok: false,
      error:
        "We're still setting up your account, so posting isn't available yet. Contact support if this doesn't clear soon.",
    };
  }

  const parsed = PostSchema.safeParse({
    content: formData.get("content"),
    accountIds: formData.getAll("accountIds"),
    when: formData.get("when"),
    scheduledAt: formData.get("scheduledAt") || undefined,
    mediaUrls: (formData.get("mediaUrls") as string | null)
      ?.split(/\s+/)
      .filter(Boolean) ?? [],
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const payload = parsed.data;
  const body: Record<string, unknown> = {
    content: payload.content,
    accountIds: payload.accountIds,
    mediaUrls: payload.mediaUrls,
  };
  if (payload.when === "schedule") {
    if (!payload.scheduledAt) {
      return {
        ok: false,
        error: "Choose the date and time you want this to go out.",
        fieldErrors: { scheduledAt: "Please pick a date and time" },
      };
    }
    body.scheduledAt = new Date(payload.scheduledAt).toISOString();
  } else {
    body.publishNow = true;
  }

  let postId: string;
  try {
    const res = (await client.posts.create(body)) as {
      id?: string;
      data?: { id?: string };
    };
    postId = res?.id ?? res?.data?.id ?? "";
  } catch (e) {
    // The audit trail keeps the real error; the customer gets plain language
    // that never names the services behind the product.
    await db.insert(auditEvents).values({
      orgId: workspace.id,
      actorUserId: session.user.id,
      action: "post.create",
      entityType: "post",
      payload: body,
      result: "error",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: friendlyError(e, "post.create") };
  }

  await db.insert(auditEvents).values({
    orgId: workspace.id,
    actorUserId: session.user.id,
    action: "post.create",
    entityType: "post",
    entityId: postId || null,
    payload: body,
    result: "ok",
  });

  redirect("/app/posts");
}
