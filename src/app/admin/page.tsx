import { sql } from "drizzle-orm";
import { db } from "@/db";
import { creditLedger, organizations, users } from "@/db/schema";

export default async function AdminOverviewPage() {
  const [[orgRow], [userRow], [creditRow], [onboardedRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(organizations),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db
      .select({
        granted: sql<number>`coalesce(sum(${creditLedger.delta}) filter (where ${creditLedger.delta} > 0), 0)::int`,
        spent: sql<number>`coalesce(abs(sum(${creditLedger.delta}) filter (where ${creditLedger.delta} < 0)), 0)::int`,
      })
      .from(creditLedger),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(organizations)
      .where(sql`${organizations.onboardingCompletedAt} is not null`),
  ]);

  const stats = [
    { label: "Organizations", value: orgRow?.count ?? 0 },
    { label: "Users", value: userRow?.count ?? 0 },
    { label: "Onboarded", value: onboardedRow?.count ?? 0 },
    { label: "Credits granted", value: (creditRow?.granted ?? 0).toLocaleString() },
    { label: "Credits spent", value: (creditRow?.spent ?? 0).toLocaleString() },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">
        Everything happening in the SaaS, at a glance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-2 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
