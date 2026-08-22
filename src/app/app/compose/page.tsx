import { redirect } from "next/navigation";
import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { ComposeForm, type AccountOption } from "./compose-form";
import { createPost } from "./actions";

export default async function ComposePage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);

  if (!client) {
    redirect("/app/settings");
  }

  let accounts: AccountOption[] = [];
  let error: string | null = null;
  try {
    const raw = await client.accounts.list();
    accounts = normalizeAccounts(raw);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Compose</h1>
      <p className="mt-2 text-slate-500">
        Cross-post to every account in one shot. Schedule for later or publish now.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Zernio error: {error}
        </div>
      )}

      {!error && accounts.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No connected accounts on your Zernio profile yet.{" "}
          <Link href="/app/accounts" className="underline">
            Connect one first
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
