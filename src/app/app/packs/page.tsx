import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { getTrialState, isBillingBlocked } from "@/lib/billing/trial";
import { getBalance } from "@/lib/credits";
import { listPacks } from "@/lib/packs";
import { PackGenerator } from "./_components/pack-generator";
import { removePack } from "./actions";

export default async function PacksPage() {
  const { workspace } = await requireWorkspace();
  const [trial, balance, packs] = await Promise.all([
    getTrialState(workspace.id),
    getBalance(workspace.id),
    listPacks(workspace.id),
  ]);
  const blocked = isBillingBlocked(trial);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Content packs</h1>
      <p className="mt-2 text-slate-400">
        A whole week or month of posts in one go — ideas, captions, what the picture
        should show, and when to publish. You review everything before anything goes out.
      </p>

      {blocked && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-300">
          {trial?.status === "past_due"
            ? "Your last payment didn't go through, so this is paused."
            : trial?.status === "canceled"
              ? "Your subscription was canceled, so this is paused."
              : "Your trial has ended, so this is paused."}{" "}
          <Link href="/app/settings" className="font-medium underline">
            Update billing
          </Link>{" "}
          to carry on.
        </div>
      )}

      {!blocked && (
        <>
          <p className="mt-6 text-sm text-slate-500">
            You have {balance.toLocaleString()} credits.
          </p>
          <div className="mt-3">
            <PackGenerator />
          </div>
        </>
      )}

      {packs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Packs you've made
          </h2>
          <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
            {packs.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link href={`/app/packs/${p.id}`} className="min-w-0 flex-1 group">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 shrink-0 text-[color:var(--nx-blue-soft)]" />
                    <span className="truncate text-sm font-medium text-white group-hover:underline">
                      {p.title}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {p.days} days · {p.createdAt.toLocaleDateString()}
                  </div>
                </Link>
                <form action={removePack}>
                  <input type="hidden" name="packId" value={p.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-red-300"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
