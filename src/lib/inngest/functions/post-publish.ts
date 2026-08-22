import { inngest } from "../client";
import { db } from "@/db";
import { auditEvents, postsCache } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { zernioForOrg } from "@/lib/zernio/for-workspace";
import { refund } from "@/lib/credits";

type Payload = { orgId: string; postId: string; runAt: string };

export const postPublish = inngest.createFunction(
  {
    id: "post-publish",
    retries: 5,
    triggers: [{ event: "post.scheduled" }],
    onFailure: async ({ event }) => {
      // Final failure — refund the original debit.
      const original = (event as { data: { event?: { data?: Payload } } }).data?.event;
      const orgId = original?.data?.orgId;
      const postId = original?.data?.postId;
      if (!orgId) return;
      try {
        await refund(orgId, "zernio.post.create", { refId: postId });
        await db.insert(auditEvents).values({
          orgId,
          action: "post.publish.refund",
          entityType: "post",
          entityId: postId ?? null,
          result: "ok",
        });
      } catch (e) {
        await db.insert(auditEvents).values({
          orgId,
          action: "post.publish.refund",
          entityType: "post",
          entityId: postId ?? null,
          result: "error",
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    },
  },
  async ({ event, step }) => {
    const { orgId, postId, runAt } = (event.data ?? {}) as Payload;

    // Wait until the scheduled moment (Inngest handles the sleep durably).
    await step.sleepUntil("wait-for-schedule", new Date(runAt));

    await step.run("verify-with-zernio", async () => {
      const zernio = await zernioForOrg(orgId);
      if (!zernio) throw new Error("No Zernio credential for org");
      const raw = (await zernio.posts.get(postId)) as {
        status?: string;
        publishedAt?: string;
      };
      if (raw.status === "failed") throw new Error("Zernio reports failed");

      await db
        .update(postsCache)
        .set({
          status: raw.status ?? "published",
          publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(postsCache.orgId, orgId),
            eq(postsCache.zernioPostId, postId),
          ),
        );

      await db.insert(auditEvents).values({
        orgId,
        action: "post.publish.confirmed",
        entityType: "post",
        entityId: postId,
        result: "ok",
      });
    });
  },
);
