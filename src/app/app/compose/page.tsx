import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { NotReadyYet } from "../_components/not-ready";
import { ComposeForm, type AccountOption } from "./compose-form";
import { createPost } from "./actions";

export default async function ComposePage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);

  if (!client) {
    return <NotReadyYet title="Create post" what="posting" />;
  }

  let accounts: AccountOption[] = [];
  let error: string | null = null;
  try {
    const raw = await client.accounts.list();
    accounts = normalizeAccounts(raw);
  } catch (e) {
    error = friendlyError(e, "compose.accounts.list");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Create post</h1>
      <p className="mt-2 text-slate-400">
        Write once and send it to all your accounts at the same time — now, or at a time
        you choose.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && accounts.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">
          You don&apos;t have any accounts connected yet, so there&apos;s nowhere to post
          to.{" "}
          <Link href="/app/accounts" className="font-medium underline">
            See your accounts
          </Link>
          .
        </div>
      )}

      {accounts.length > 0 && <ComposeForm accounts={accounts} action={createPost} />}
    </div>
  );
}

function normalizeAccounts(raw: unknown): AccountOption[] {
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] })?.data)
      ? (raw as { data: unknown[] }).data
      : [];
  return rows
    .map((r) => {
      if (typeof r !== "object" || r === null) return null;
      const rec = r as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id : null;
      if (!id) return null;
      return {
        id,
        name: typeof rec.name === "string" ? rec.name : id,
        platform: typeof rec.platform === "string" ? rec.platform : "unknown",
      };
    })
    .filter((x): x is AccountOption => x !== null);
}
