import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";

type Account = {
  id: string;
  name?: string;
  platform?: string;
  profileId?: string;
};

export default async function AccountsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  if (!client) redirect("/app/settings");

  let accounts: Account[] = [];
  let error: string | null = null;
  try {
    const raw = (await client.accounts.list()) as { data?: Account[] } | Account[];
    accounts = Array.isArray(raw) ? raw : (raw.data ?? []);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold">Accounts</h1>
      <p className="mt-2 text-slate-500">
        Connected accounts on your Zernio profile. Add new ones from the Zernio dashboard
        for now — connect flow lands in Phase 6.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
        {accounts.length === 0 && !error && (
          <li className="p-6 text-center text-sm text-slate-500">
            No accounts connected yet.
          </li>
        )}
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{a.name ?? a.id}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {a.platform ?? "unknown"}
              </div>
            </div>
            <div className="text-xs text-slate-500">{a.id}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
