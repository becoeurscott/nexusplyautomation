import { router, protectedProcedure, orgProcedure } from "../trpc";
import { getBalance } from "@/lib/credits";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, organizationMembers } from "@/db/schema";

export const meRouter = router({
  session: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.session.user,
      orgId: ctx.orgId,
    };
  }),

  org: orgProcedure.query(async ({ ctx }) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.orgId, ctx.orgId));

    const balance = await getBalance(ctx.orgId);

    return { org, members, creditBalance: balance };
  }),
});
