import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireSession } from "@/lib/workspace";

/**
 * Gate for everything under /admin. Not linked from any customer-facing UI.
 *
 * Two ways in:
 *  - `ADMIN_EMAILS` env allowlist (comma-separated) — the bootstrap path,
 *    no DB row needed. Use this to grant yourself access on day one.
 *  - `admin_users` table — for admins granted after the fact (support staff,
 *    co-founders). Add rows here once the allowlist path is inconvenient.
 *
 * Unauthenticated visitors bounce to /sign-in; authenticated non-admins
 * bounce to /app — neither path reveals that /admin exists as a distinct
 * gated area beyond a normal 404-shaped redirect.
 */
export async function requireAdmin() {
  const session = await requireSession();

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.includes(session.user.email.toLowerCase())) {
    return session;
  }

  const row = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.userId, session.user.id),
  });
  if (row) return session;

  redirect("/app");
}
