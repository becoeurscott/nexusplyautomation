"use client";

import { useActionState } from "react";
import { createWatchlist, type WatchlistActionState } from "../actions";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
];

export function WatchlistForm() {
  const [state, submit, pending] = useActionState<WatchlistActionState, FormData>(
    createWatchlist,
    null,
  );

  return (
    <form action={submit} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-xs text-slate-400">Platform</span>
        <select
          name="platform"
          defaultValue="tiktok"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--nx-blue)]"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value} className="bg-[color:var(--nx-bg)]">
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex-1 text-sm">
        <span className="mb-1 block text-xs text-slate-400">
          What you post about <span className="text-slate-500">(optional)</span>
        </span>
        <input
          type="text"
          name="niche"
          placeholder="e.g. primary school admissions"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
        />
      </label>

      <label className="flex-1 text-sm">
        <span className="mb-1 block text-xs text-slate-400">
          Keywords <span className="text-slate-500">(comma separated)</span>
        </span>
        <input
          type="text"
          name="keywords"
          placeholder="admissions, open day"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>

      {state && !state.ok && (
        <p className="w-full text-xs text-red-300">{state.message}</p>
      )}
    </form>
  );
}
