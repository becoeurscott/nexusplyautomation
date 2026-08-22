"use client";

import { useActionState, useState } from "react";
import type { CreatePostResult } from "./actions";

export type AccountOption = { id: string; name: string; platform: string };

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-pink-50 text-pink-700 border-pink-200",
  youtube: "bg-red-50 text-red-700 border-red-200",
  instagram: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  facebook: "bg-blue-50 text-blue-700 border-blue-200",
  linkedin: "bg-sky-50 text-sky-700 border-sky-200",
  x: "bg-slate-100 text-slate-700 border-slate-200",
  threads: "bg-slate-100 text-slate-700 border-slate-200",
  pinterest: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-200",
};

export function ComposeForm({
  accounts,
  action,
}: {
  accounts: AccountOption[];
  action: (
    prev: CreatePostResult | null,
    fd: FormData,
  ) => Promise<CreatePostResult>;
}) {
  const [state, submit, pending] = useActionState(action, null);
  const [when, setWhen] = useState<"now" | "schedule">("schedule");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={submit} className="mt-8 space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium">Post to</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((a) => {
            const active = selected.has(a.id);
            const cls =
              PLATFORM_COLORS[a.platform.toLowerCase()] ?? PLATFORM_COLORS.unknown;
            return (
              <label
                key={a.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  active ? "border-[color:var(--nx-blue)] bg-[#eff6ff]" : "border-slate-100 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="accountIds"
                  value={a.id}
                  checked={active}
                  onChange={() => toggle(a.id)}
                  className="h-4 w-4 accent-[color:var(--nx-blue)]"
                />
                <span className={`rounded px-1.5 py-0.5 text-xs uppercase ${cls}`}>
                  {a.platform}
                </span>
                <span className="truncate">{a.name}</span>
              </label>
            );
          })}
        </div>
        {fieldErrors.accountIds && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.accountIds}</div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Content <span className="ml-1 text-slate-500">{content.length}</span>
        </label>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-[color:var(--nx-blue)]"
          placeholder="What do you want to say?"
        />
        {fieldErrors.content && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.content}</div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Media URLs</label>
        <textarea
          name="mediaUrls"
          rows={2}
          placeholder="Paste one or more public https URLs, separated by spaces or newlines"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[color:var(--nx-blue)]"
        />
        <p className="mt-1 text-xs text-slate-500">
          Upload flow lands in the next phase. For now, paste public URLs (e.g. from your CDN).
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">When</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="when"
            value="schedule"
            checked={when === "schedule"}
            onChange={() => setWhen("schedule")}
            className="accent-[color:var(--nx-blue)]"
          />
          Schedule
        </label>
        {when === "schedule" && (
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="ml-6 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="when"
            value="now"
            checked={when === "now"}
            onChange={() => setWhen("now")}
            className="accent-[color:var(--nx-blue)]"
          />
          Publish now
        </label>
      </fieldset>

      {state && !state.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[color:var(--nx-blue)] px-6 py-2 font-medium text-white hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
      >
        {pending ? "Sending…" : when === "now" ? "Publish now" : "Schedule post"}
      </button>
    </form>
  );
}
