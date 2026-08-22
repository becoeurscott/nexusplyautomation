import { router, orgProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/db";
import { brandExamples, brandProfiles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

const BrandProfileInput = z.object({
  name: z.string().min(1).max(120),
  niche: z.string().max(200).optional(),
  audience: z.string().max(500).optional(),
  toneWords: z.array(z.string()).default([]),
  forbiddenWords: z.array(z.string()).default([]),
  colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    })
    .default({}),
  voiceNotes: z.string().max(4_000).optional(),
  topHashtags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
});

export const brandRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.orgId, ctx.orgId))
      .orderBy(desc(brandProfiles.createdAt));
    return { rows };
  }),

  create: orgProcedure
    .input(BrandProfileInput)
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(brandProfiles)
        .values({ orgId: ctx.orgId, ...input })
        .returning();
      return { profile: row };
    }),

  update: orgProcedure
    .input(z.object({ id: z.string().uuid(), patch: BrandProfileInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .update(brandProfiles)
        .set({ ...input.patch, updatedAt: new Date() })
        .where(
          and(
            eq(brandProfiles.id, input.id),
            eq(brandProfiles.orgId, ctx.orgId),
          ),
        )
        .returning();
      return { profile: row };
    }),

  remove: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(brandProfiles)
        .where(
          and(
            eq(brandProfiles.id, input.id),
            eq(brandProfiles.orgId, ctx.orgId),
          ),
        );
      return { ok: true };
    }),

  addExample: orgProcedure
    .input(
      z.object({
        brandProfileId: z.string().uuid(),
        kind: z.enum(["top_post", "brand_ref", "manual_snippet"]).default("manual_snippet"),
        content: z.string().min(1).max(10_000),
        sourcePlatform: z.string().optional(),
        sourceUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the profile belongs to this org.
      const profile = await db.query.brandProfiles.findFirst({
        where: and(
          eq(brandProfiles.id, input.brandProfileId),
          eq(brandProfiles.orgId, ctx.orgId),
        ),
      });
      if (!profile) throw new Error("Brand profile not found");
      const [row] = await db.insert(brandExamples).values(input).returning();
      return { example: row };
    }),
});
