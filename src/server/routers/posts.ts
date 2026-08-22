import { router, orgProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { withCredits } from "@/lib/credits";
import { zernioForOrg } from "@/lib/zernio/for-workspace";
import { db } from "@/db";
import { auditEvents, postsCache } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const CreatePostInput = z.object({
  content: z.string().min(1).max(10_000),
  accountIds: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime().optional(),
  publishNow: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).default([]),
});

export const postsRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
          status: z.string().optional(),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(postsCache)
        .where(eq(postsCache.orgId, ctx.orgId))
        .orderBy(desc(postsCache.updatedAt))
        .limit(input.limit);
      return { rows };
    }),

  create: orgProcedure.input(CreatePostInput).mutation(async ({ ctx, input }) => {
    const zernio = await zernioForOrg(ctx.orgId);
    if (!zernio) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Connect your Zernio API key in Settings first.",
      });
    }

    // 1 credit for the first account + 1 credit per extra cross-post.
    const extra = Math.max(0, input.accountIds.length - 1);

    // Debit is atomic; refund happens automatically if the Zernio call throws.
    const { result, balanceAfter } = await withCredits(
      {
        orgId: ctx.orgId,
        action: "zernio.post.create",
        actorUserId: ctx.session.user.id,
        multiplier: 1 + extra, // total credit cost = 1 base + N extras
      },
      async () => {
        const body: Record<string, unknown> = {
          content: input.content,
          accountIds: input.accountIds,
          mediaUrls: input.mediaUrls,
        };
        if (input.publishNow) body.publishNow = true;
        else if (input.scheduledAt) body.scheduledAt = input.scheduledAt;

        const raw = (await zernio.posts.create(body)) as {
          id?: string;
          data?: { id?: string };
        };
        return raw.id ?? raw.data?.id ?? "";
      },
    );

    await db.insert(auditEvents).values({
      orgId: ctx.orgId,
      actorUserId: ctx.session.user.id,
      action: "post.create",
      entityType: "post",
      entityId: result || null,
      payload: input,
      result: "ok",
    });

    return { postId: result, balanceAfter };
  }),

  publishNow: orgProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const zernio = await zernioForOrg(ctx.orgId);
      if (!zernio) throw new TRPCError({ code: "PRECONDITION_FAILED" });
      const raw = await zernio.posts.publishNow(input.postId);
      await db.insert(auditEvents).values({
        orgId: ctx.orgId,
        actorUserId: ctx.session.user.id,
        action: "post.publish_now",
        entityType: "post",
        entityId: input.postId,
        result: "ok",
      });
      return { ok: true, raw };
    }),

  remove: orgProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const zernio = await zernioForOrg(ctx.orgId);
      if (!zernio) throw new TRPCError({ code: "PRECONDITION_FAILED" });
      await zernio.posts.remove(input.postId);
      await db.insert(auditEvents).values({
        orgId: ctx.orgId,
        actorUserId: ctx.session.user.id,
        action: "post.remove",
        entityType: "post",
        entityId: input.postId,
        result: "ok",
      });
      return { ok: true };
    }),
});
