import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { getTrialState, isBillingBlocked } from "@/lib/billing/trial";
import { NotReadyYet } from "../_components/not-ready";
import { ComposeForm, type AccountOption } from "./compose-form";
import { createPost } from "./actions";
import { rows, str } from "../_lib/normalize";

export default async function ComposePage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);

  if (!client) {
    return <NotReadyYet title="Create post" what="posting" />;
  }

  const trial = await getTrialState(workspace.id);
  const blocked = isBillingBlocked(trial);

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

      {blocked && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">
          {trial?.status === "past_due"
            ? "Your last payment didn't go through, so posting is paused."
            : trial?.status === "canceled"
              ? "Your subscription was canceled, so posting is paused."
              : "Your trial has ended, so posting is paused."}{" "}
          <Link href="/app/settings" className="font-medium underline">
            Update billing
          </Link>{" "}
          to keep posting.
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && !blocked && accounts.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">
          You don&apos;t have any accounts connected yet, so there&apos;s nowhere to post
          to.{" "}
          <Link href="/app/accounts" className="font-medium underline">
            See your accounts
          </Link>
          .
        </div>
      )}

      {!blocked && accounts.length > 0 && (
        <ComposeForm accounts={accounts} action={createPost} />
      )}
    </div>
  );
}

function normalizeAccounts(raw: unknown): AccountOption[] {
  return rows(raw, "accounts")
    .map((rec) => {
      const id = str(rec, "id", "_id");
      if (!id) return null;
      return {
        id,
        name: str(rec, "name", "username", "handle") ?? id,
        platform: str(rec, "platform", "provider") ?? "unknown",
      };
    })
    .filter((x): x is AccountOption => x !== null);
}
