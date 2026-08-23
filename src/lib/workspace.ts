import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizationMembers, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { startTrial } from "@/lib/billing/trial";

export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session;
});

async function findOrgForUser(userId: string) {
  const rows = await db
    .select({ org: organizations, role: organizationMembers.role })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(eq(organizationMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Returns the current user's active organization, auto-creating a personal
 * org on first login. Memoised per request via React `cache()` so layout and
 * page share one lookup; the insert is idempotent so concurrent first-hits
 * (layout + page in parallel) cannot race into a unique-slug violation.
 */
export const requireOrg = cache(async () => {
  const session = await requireSession();
  const userId = session.user.id;

  const existing = await findOrgForUser(userId);
  if (existing) return { session, org: existing.org, role: existing.role };

  const slug = `w-${userId.slice(0, 8)}`;
  const name = session.user.name ? `${session.user.name}'s workspace` : "My workspace";

  // `returning()` tells us whether this call actually created the org. The
  // insert is idempotent, so concurrent first-hits (layout + page in parallel)
  // both reach here but only one gets a row back — which is what keeps the
  // trial from being granted twice.
  const created = await db
    .insert(organizations)
    .values({ name, slug, ownerId: userId })
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) throw new Error("Failed to provision organization");

  await db
    .insert(organizationMembers)
    .values({ orgId: org.id, userId, role: "owner" })
    .onConflictDoNothing();

  if (created.length > 0) {
    // Never throws — a missing plan row must not block someone signing up.
    await startTrial(org.id);
    const [fresh] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, org.id))
      .limit(1);
    if (fresh) return { session, org: fresh, role: "owner" as const };
  }

  return { session, org, role: "owner" as const };
});

/** Legacy alias — Phase-1 pages call this. Prefer `requireOrg()` in new code. */
export async function requireWorkspace() {
  const { session, org, role } = await requireOrg();
  return { session, workspace: org, role };
}

export async function assertMember(orgId: string, userId: string) {
  const row = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, userId),
    ),
  });
  if (!row) throw new Error("Not a member of this organization");
  return row;
}
