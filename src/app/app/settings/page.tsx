import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { getTrialState } from "@/lib/billing/trial";
import { friendlyError } from "@/lib/user-message";
import { PlatformBadge } from "../_components/platform-badge";
import { ConnectAccountButton } from "../_components/connect-account-button";
import { rows, str } from "../_lib/normalize";

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
      accounts = rows(await client.accounts.list(), "accounts").map((r) => ({
        id: str(r, "id", "_id") ?? "",
        name: str(r, "name", "username", "handle") ?? undefined,
        platform: str(r, "platform", "provider") ?? undefined,
      }));
    } catch (e) {
      error = friendlyError(e, "settings.accounts.list");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="mt-8 nx-glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Your workspace</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Workspace name</dt>
            <dd className="font-medium text-white">{workspace.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Creation credits left</dt>
            <dd className="font-medium text-white">{balance}</dd>
          </div>
          {trial && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Plan</dt>
              <dd className="font-medium text-white">
                {trial.status === "trialing"
                  ? trial.expired
                    ? `${trial.planName} trial (ended)`
                    : `${trial.planName} trial · ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`
                  : trial.planName}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-6 nx-glass rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Connected accounts</h2>
            <p className="mt-1 text-sm text-slate-400">
              Posting, results, and messages are all set up for you — there&apos;s
              nothing to configure here.
            </p>
          </div>
          <ConnectAccountButton />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!error && !client && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            We&apos;re still setting up your account. Your social accounts will appear
            here once they&apos;re linked — you don&apos;t need to do anything.
          </div>
        )}

        {!error && client && accounts.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm text-slate-400">
              No accounts connected yet. Once we link your first one, it will show up
              here.
            </p>
            <ConnectAccountButton variant="empty-state" />
          </div>
        )}

        {accounts.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 truncate font-medium text-white">
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
