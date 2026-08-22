import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditLedger, organizations } from "@/db/schema";

export default async function AdminCreditsPage() {
  const rows = await db
    .select({
      id: creditLedger.id,
      delta: creditLedger.delta,
      reason: creditLedger.reason,
      note: creditLedger.note,
      balanceAfter: creditLedger.balanceAfter,
      createdAt: creditLedger.createdAt,
      orgId: creditLedger.orgId,
      orgName: organizations.name,
    })
    .from(creditLedger)
    .innerJoin(organizations, eq(organizations.id, creditLedger.orgId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Credit ledger</h1>
      <p className="mt-1 text-sm text-slate-500">Most recent 100 entries across every org.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Delta</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Balance after</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/organizations/${r.orgId}`}
                    className="text-white hover:underline"
                  >
                    {r.orgName}
                  </Link>
                </td>
                <td
                  className={
                    "px-4 py-3 font-mono font-semibold " +
                    (r.delta >= 0 ? "text-emerald-400" : "text-red-400")
                  }
                >
                  {r.delta >= 0 ? "+" : ""}
                  {r.delta}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {r.reason}
                  {r.note ? ` — ${r.note}` : ""}
                </td>
                <td className="px-4 py-3 font-mono">{r.balanceAfter}</td>
                <td className="px-4 py-3 text-slate-500">{r.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No ledger activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
