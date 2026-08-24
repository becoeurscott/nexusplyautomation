import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { rows, str } from "../_lib/normalize";
import { NotReadyYet } from "../_components/not-ready";
import { PlatformBadge, platformLabel } from "../_components/platform-badge";
import { ConnectAccountButton } from "../_components/connect-account-button";
import { listConnections } from "@/lib/oauth/connections";

type Account = {
  id: string;
  name?: string;
  platform?: string;
  profileId?: string;
};

const CALLBACK_ERRORS: Record<string, string> = {
  tiktok_access_denied: "You didn't approve the TikTok connection, so nothing changed.",
  tiktok_invalid_state: "That connection link expired. Try connecting again.",
  tiktok_org_mismatch: "That connection wasn't started from this workspace.",
  tiktok_missing_params: "TikTok didn't send back what we needed. Try again.",
  tiktok_exchange_failed: "We couldn't finish connecting your TikTok account. Try again.",
  tiktok_not_configured: "TikTok connections aren't turned on yet.",
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const connected = typeof params.connected === "string" ? params.connected : null;
  const errorCode = typeof params.error === "string" ? params.error : null;

  const directConnections = await listConnections(workspace.id);

  const client = await zernioForWorkspace(workspace.id);

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
      error = friendlyError(e, "accounts.list");
    }
  }

  if (!client && directConnections.length === 0) {
    return (
      <NotReadyYet
        title="My accounts"
        what="your social accounts"
        action={<ConnectAccountButton />}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My accounts</h1>
          <p className="mt-2 text-slate-400">
            These are the social accounts you can post to. Connect another one below —
            there&apos;s nothing to set up yourself.
          </p>
        </div>
        <ConnectAccountButton />
      </div>

      {connected && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {platformLabel(connected)} connected.
        </div>
      )}
      {errorCode && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
          {CALLBACK_ERRORS[errorCode] ?? "That connection didn't go through. Try again."}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {directConnections.length > 0 && (
        <ul className="mt-6 nx-glass divide-y divide-white/10 rounded-2xl">
          {directConnections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium text-white">
                  {c.displayName ?? c.providerAccountId}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {c.status === "active"
                    ? "Connected directly — ready to post"
                    : c.status === "expired"
                      ? "Connection expired — reconnect below"
                      : c.status === "error"
                        ? "Something's wrong with this connection — reconnect below"
                        : "Disconnected"}
                </div>
              </div>
              <PlatformBadge platform={c.platform} />
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-6 nx-glass divide-y divide-white/10 rounded-2xl">
        {accounts.length === 0 && !error && directConnections.length === 0 && (
          <li className="p-8 text-center">
            <p className="text-sm text-slate-400">
              No accounts connected yet. Once we link your first one, it will appear
              here.
            </p>
            <ConnectAccountButton variant="empty-state" />
          </li>
        )}
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{a.name ?? "Account"}</div>
              <div className="mt-0.5 text-xs text-slate-400">Ready to post</div>
            </div>
            <PlatformBadge platform={a.platform} />
          </li>
        ))}
      </ul>
    </div>
  );
}
