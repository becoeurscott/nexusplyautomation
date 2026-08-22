import { router, orgProcedure } from "../trpc";
import { getBalance, CREDIT_PRICE_SEED } from "@/lib/credits";
import { db } from "@/db";
import { creditLedger } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const creditsRouter = router({
  balance: orgProcedure.query(async ({ ctx }) => {
    const balance = await getBalance(ctx.orgId);
    return { balance };
  }),

  ledger: orgProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.orgId, ctx.orgId))
        .orderBy(desc(creditLedger.createdAt))
        .limit(input.limit);
      return { rows };
    }),

  prices: orgProcedure.query(async () => {
    return { prices: CREDIT_PRICE_SEED };
  }),
});
