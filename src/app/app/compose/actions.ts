"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { ZernioApiError } from "@/lib/zernio/client";

const PostSchema = z.object({
  content: z.string().min(1, "Content is required").max(10_000),
  accountIds: z.array(z.string()).min(1, "Pick at least one account"),
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
  const client = await zernioForWorkspace(workspace.id);
  if (!client) {
    return { ok: false, error: "Connect a Zernio API key first." };
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
    return { ok: false, error: "Invalid form", fieldErrors };
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
        error: "Pick a date/time to schedule.",
        fieldErrors: { scheduledAt: "Required when scheduling" },
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
    const msg =
      e instanceof ZernioApiError
        ? `Zernio ${e.status}: ${JSON.stringify(e.body)}`
        : e instanceof Error
          ? e.message
          : String(e);
    await db.insert(auditEvents).values({
      orgId: workspace.id,
      actorUserId: session.user.id,
      action: "post.create",
      entityType: "post",
      payload: body,
      result: "error",
      errorMessage: msg,
    });
    return { ok: false, error: msg };
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
