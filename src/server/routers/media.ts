import { router, orgProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { withCredits } from "@/lib/credits";
import { mediaProvider } from "@/lib/media";
import { db } from "@/db";
import { auditEvents, mediaAssets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const mediaRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          kind: z.enum(["image", "video", "audio"]).optional(),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .default({ limit: 100 }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.orgId, ctx.orgId))
        .orderBy(desc(mediaAssets.createdAt))
        .limit(input.limit);
      return {
        rows: input.kind ? rows.filter((r) => r.kind === input.kind) : rows,
      };
    }),

  generateImage: orgProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(2_000),
        aspectRatio: z.string().default("1:1"),
        seed: z.number().int().optional(),
        referenceImageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = mediaProvider();
      if (!provider.isConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Image generation isn't available yet.",
        });
      }
      const { result, balanceAfter } = await withCredits(
        {
          orgId: ctx.orgId,
          action: "media.image.generate",
          actorUserId: ctx.session.user.id,
        },
        async () => provider.generateImage(input),
      );

      const url = result.url;
      let insertedId: string | null = null;
      if (url) {
        const [row] = await db
          .insert(mediaAssets)
          .values({
            orgId: ctx.orgId,
            kind: "image",
            url,
            source: "generated",
            sourceRef: result.ref,
            meta: { prompt: input.prompt, aspectRatio: input.aspectRatio },
          })
          .returning({ id: mediaAssets.id });
        insertedId = row.id;
      }

      await db.insert(auditEvents).values({
        orgId: ctx.orgId,
        actorUserId: ctx.session.user.id,
        action: "media.image.generate",
        entityType: "media_asset",
        entityId: insertedId,
        payload: input,
        result: "ok",
      });

      return { assetId: insertedId, raw: result, balanceAfter };
    }),

  generateVideo: orgProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(2_000),
        aspectRatio: z.string().default("9:16"),
        durationSec: z.number().int().min(1).max(60).default(5),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const provider = mediaProvider();
      if (!provider.isConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Video generation isn't available yet.",
        });
      }
      const { result, balanceAfter } = await withCredits(
        {
          orgId: ctx.orgId,
          action: "media.video.generate",
          actorUserId: ctx.session.user.id,
        },
        async () => provider.generateVideo(input),
      );
      const url = result.url;
      let insertedId: string | null = null;
      if (url) {
        const [row] = await db
          .insert(mediaAssets)
          .values({
            orgId: ctx.orgId,
            kind: "video",
            url,
            source: "generated",
            sourceRef: result.ref,
            meta: input as unknown as Record<string, unknown>,
          })
          .returning({ id: mediaAssets.id });
        insertedId = row.id;
      }
      return { assetId: insertedId, raw: result, balanceAfter };
    }),
});
