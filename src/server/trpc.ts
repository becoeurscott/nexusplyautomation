import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { organizationMembers, organizations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type Context = {
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  orgId: string | null;
};

export async function createContext(): Promise<Context> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { session: null, orgId: null };

  const row = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, session.user.id),
  });

  return { session, orgId: row?.orgId ?? null };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Requires a signed-in user. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** Requires a signed-in user with an org membership. */
export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.orgId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No org membership" });
  }
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);
  if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Org not found" });

  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, ctx.orgId),
        eq(organizationMembers.userId, ctx.session.user.id),
      ),
    )
    .limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

  return next({
    ctx: {
      ...ctx,
      orgId: ctx.orgId,
      org,
      role: membership.role,
    },
  });
});

/** Admin-only — checks `admin_users` row. */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const row = await db.query.adminUsers.findFirst({
    where: (t, { eq }) => eq(t.userId, ctx.session.user.id),
  });
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx: { ...ctx, admin: row } });
});
