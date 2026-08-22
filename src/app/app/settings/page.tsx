import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";

type Account = { id: string; name?: string; platform?: string };

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);

  let accounts: Account[] = [];
  let error: string | null = null;
  if (client) {
    try {
      const raw = (await client.accounts.list()) as { data?: Account[] } | Account[];
      accounts = Array.isArray(raw) ? raw : (raw.data ?? []);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Connected accounts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Publishing, analytics, and inbox are set up for you — nothing to configure here.
          Want a new platform connected? Reach out to support and we'll get it linked.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!error && !client && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Your workspace isn't linked to a publishing account yet — contact support to
            get set up.
          </div>
        )}

        {!error && client && accounts.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No accounts connected yet. Head to{" "}
            <a href="/onboarding" className="underline">
              onboarding
            </a>{" "}
            to pick your platforms, or contact support.
          </div>
        )}

        {accounts.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="font-medium text-slate-800">{a.name ?? a.id}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {a.platform ?? "unknown"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
