import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { getTrialState } from "@/lib/billing/trial";
import { friendlyError } from "@/lib/user-message";
import { PlatformBadge } from "../_components/platform-badge";

type Account = { id: string; name?: string; platform?: string };

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  const balance = await getBalance(workspace.id);
  const trial = await getTrialState(workspace.id);

  let accounts: Account[] = [];
  let error: string | null = null;
  if (client) {
    try {
      const raw = (await client.accounts.list()) as { data?: Account[] } | Account[];
      accounts = Array.isArray(raw) ? raw : (raw.data ?? []);
    } catch (e) {
      error = friendlyError(e, "settings.accounts.list");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Your workspace</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Workspace name</dt>
            <dd className="font-medium text-slate-800">{workspace.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Credits left</dt>
            <dd className="font-medium text-slate-800">{balance}</dd>
          </div>
          {trial && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium text-slate-800">
                {trial.status === "trialing"
                  ? trial.expired
                    ? "Free trial (ended)"
                    : `Free trial · ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`
                  : "Active"}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Connected accounts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Posting, results, and messages are all set up for you — there&apos;s nothing to
          configure here. Want another account connected? Contact support and we&apos;ll
          link it for you.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!error && !client && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            We&apos;re still setting up your account. Your social accounts will appear
            here once they&apos;re linked — you don&apos;t need to do anything.
          </div>
        )}

        {!error && client && accounts.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No accounts connected yet. Once we link your first one, it will show up here.
          </div>
        )}

        {accounts.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 truncate font-medium text-slate-800">
                  {a.name ?? "Account"}
                </div>
                <PlatformBadge platform={a.platform} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
