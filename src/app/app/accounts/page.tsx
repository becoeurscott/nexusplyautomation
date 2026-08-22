import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { NotReadyYet } from "../_components/not-ready";
import { PlatformBadge } from "../_components/platform-badge";

type Account = {
  id: string;
  name?: string;
  platform?: string;
  profileId?: string;
};

export default async function AccountsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  if (!client) {
    return <NotReadyYet title="My accounts" what="your social accounts" />;
  }

  let accounts: Account[] = [];
  let error: string | null = null;
  try {
    const raw = (await client.accounts.list()) as { data?: Account[] } | Account[];
    accounts = Array.isArray(raw) ? raw : (raw.data ?? []);
  } catch (e) {
    error = friendlyError(e, "accounts.list");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold">My accounts</h1>
      <p className="mt-2 text-slate-500">
        These are the social accounts you can post to. Want to add another one? Contact
        support and we&apos;ll connect it for you — there&apos;s nothing to set up
        yourself.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
        {accounts.length === 0 && !error && (
          <li className="p-8 text-center text-sm text-slate-500">
            No accounts connected yet. Once we link your first one, it will appear here.
          </li>
        )}
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800">{a.name ?? "Account"}</div>
              <div className="mt-0.5 text-xs text-slate-500">Ready to post</div>
            </div>
            <PlatformBadge platform={a.platform} />
          </li>
        ))}
      </ul>
    </div>
  );
}
