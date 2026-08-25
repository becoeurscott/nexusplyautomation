import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  creditLedger,
  organizationMembers,
  organizations,
  plans,
  subscriptions,
  users,
} from "@/db/schema";
import { listConnections } from "@/lib/oauth/connections";
import { platformLabel } from "@/app/app/_components/platform-badge";
import {
  adjustCredits,
  cancelStripeSubscription,
  disconnectSocialConnection,
  toggleOnboarded,
} from "./actions";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!org) notFound();

  const members = await db
    .select({ role: organizationMembers.role, email: users.email, name: users.name })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, id));

  const ledger = await db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.orgId, id))
    .orderBy(desc(creditLedger.createdAt))
    .limit(30);

  const connections = await listConnections(id);

  const [subscription] = await db
    .select({
      id: subscriptions.id,
      provider: subscriptions.provider,
      status: subscriptions.status,
      providerSubRef: subscriptions.providerSubRef,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      billingInterval: subscriptions.billingInterval,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.orgId, id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold">{org.name}</h1>
      <p className="mt-1 font-mono text-xs text-slate-500">{org.id}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Credit balance" value={org.creditBalanceCached} />
        <Stat label="Country" value={`${org.country} · ${org.currency}`} />
        <Stat label="Onboarded" value={org.onboardingCompletedAt ? "Yes" : "No"} />
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Members
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.email} className="flex items-center justify-between">
              <span>{m.name ?? m.email}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase text-slate-300">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Adjust credits
        </h2>
        <form action={adjustCredits} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="orgId" value={org.id} />
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Delta (+/-)</span>
            <input
              type="number"
              name="delta"
              required
              className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono outline-none focus:border-[color:var(--nx-blue,#2563eb)]"
              placeholder="100 or -50"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-slate-400">Note</span>
            <input
              type="text"
              name="note"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-[color:var(--nx-blue,#2563eb)]"
              placeholder="Reason for this adjustment"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[color:var(--nx-blue,#2563eb)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Apply
          </button>
        </form>

        <form action={toggleOnboarded} className="mt-4">
          <input type="hidden" name="orgId" value={org.id} />
          <input
            type="hidden"
            name="nextValue"
            value={org.onboardingCompletedAt ? "false" : "true"}
          />
          <button
            type="submit"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            {org.onboardingCompletedAt ? "Reset onboarding" : "Mark onboarded"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Subscription
        </h2>
        {subscription ? (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{subscription.planName}</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] uppercase " +
                    (subscription.status === "active"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : subscription.status === "past_due"
                        ? "bg-red-500/15 text-red-300"
                        : subscription.status === "canceled"
                          ? "bg-white/10 text-slate-300"
                          : "bg-amber-500/15 text-amber-300")
                  }
                >
                  {subscription.status}
                </span>
              </div>
              <div className="truncate text-xs text-slate-500">
                {subscription.provider} · {subscription.billingInterval} · renews{" "}
                {subscription.currentPeriodEnd
                  ? subscription.currentPeriodEnd.toLocaleString()
                  : "unknown"}
              </div>
            </div>
            {subscription.provider === "stripe" &&
              subscription.status !== "canceled" && (
                <form action={cancelStripeSubscription}>
                  <input type="hidden" name="orgId" value={org.id} />
                  <input type="hidden" name="subscriptionId" value={subscription.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                  >
                    Cancel subscription
                  </button>
                </form>
              )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No subscription.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Connections
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Direct OAuth connections this org holds independent of Zernio — see
          src/lib/oauth. Disconnecting deletes the stored tokens; the org can
          reconnect any time from My accounts.
        </p>
        <ul className="mt-3 divide-y divide-white/5 text-sm">
          {connections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{platformLabel(c.platform)}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] uppercase " +
                      (c.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : c.status === "error" || c.status === "revoked"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-amber-500/15 text-amber-300")
                    }
                  >
                    {c.status}
                  </span>
                </div>
                <div className="truncate text-xs text-slate-500">
                  {c.displayName ?? c.providerAccountId} · expires{" "}
                  {c.expiresAt ? c.expiresAt.toLocaleString() : "unknown"}
                </div>
              </div>
              <form action={disconnectSocialConnection}>
                <input type="hidden" name="orgId" value={org.id} />
                <input type="hidden" name="connectionId" value={c.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                >
                  Disconnect
                </button>
              </form>
            </li>
          ))}
          {connections.length === 0 && (
            <li className="py-4 text-center text-slate-500">No direct connections.</li>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent ledger activity
        </h2>
        <ul className="mt-3 divide-y divide-white/5 text-sm">
          {ledger.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-2">
              <div>
                <span
                  className={
                    "font-mono font-semibold " +
                    (l.delta >= 0 ? "text-emerald-400" : "text-red-400")
                  }
                >
                  {l.delta >= 0 ? "+" : ""}
                  {l.delta}
                </span>
                <span className="ml-2 text-slate-400">{l.reason}</span>
                {l.note && <span className="ml-2 text-slate-500">— {l.note}</span>}
              </div>
              <span className="text-xs text-slate-500">
                {l.createdAt.toLocaleString()}
              </span>
            </li>
          ))}
          {ledger.length === 0 && (
            <li className="py-4 text-center text-slate-500">No activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
