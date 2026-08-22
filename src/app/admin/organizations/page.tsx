import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";

export default async function AdminOrganizationsPage() {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      country: organizations.country,
      currency: organizations.currency,
      creditBalance: organizations.creditBalanceCached,
      onboarded: organizations.onboardingCompletedAt,
      createdAt: organizations.createdAt,
      ownerEmail: users.email,
    })
    .from(organizations)
    .leftJoin(users, eq(users.id, organizations.ownerId))
    .orderBy(desc(organizations.createdAt));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Organizations</h1>
      <p className="mt-1 text-sm text-slate-500">{rows.length} total.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Onboarded</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/organizations/${r.id}`}
                    className="font-medium text-white hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-400">{r.ownerEmail ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">
                  {r.country} · {r.currency}
                </td>
                <td className="px-4 py-3 font-mono">{r.creditBalance}</td>
                <td className="px-4 py-3">
                  {r.onboarded ? (
                    <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-xs text-emerald-300">
                      Yes
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-950/40 px-2 py-0.5 text-xs text-amber-300">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {r.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No organizations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
