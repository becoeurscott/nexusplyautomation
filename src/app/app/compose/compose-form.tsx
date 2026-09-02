"use client";

import { useActionState, useState } from "react";
import type { CreatePostResult } from "./actions";
import { platformLabel } from "../_components/platform-badge";
import { ScorePanel } from "./_components/score-panel";

export type AccountOption = { id: string; name: string; platform: string };

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-pink-500/15 text-pink-300 border-pink-400/25",
  youtube: "bg-red-500/15 text-red-300 border-red-400/25",
  instagram: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/25",
  facebook: "bg-[color:var(--nx-blue)]/20 text-[color:var(--nx-blue-soft)] border-[color:var(--nx-blue)]/30",
  linkedin: "bg-sky-500/15 text-sky-300 border-sky-400/25",
  x: "bg-white/10 text-slate-200 border-white/15",
  threads: "bg-white/10 text-slate-200 border-white/15",
  pinterest: "bg-red-500/15 text-red-300 border-red-400/25",
  unknown: "bg-white/10 text-slate-200 border-white/15",
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

  /** Appends only the tags the post doesn't already carry, so "Add all" twice
   *  doesn't duplicate them. */
  const appendHashtags = (tags: string[]) => {
    setContent((prev) => {
      const missing = tags.filter(
        (t) => !new RegExp(`(^|\\s)${escapeRegExp(t)}(\\s|$)`, "i").test(prev),
      );
      if (missing.length === 0) return prev;
      const sep = prev.trim().length === 0 ? "" : prev.endsWith("\n") ? "\n" : "\n\n";
      return `${prev}${sep}${missing.join(" ")}`;
    });
  };

  return (
    <form action={submit} className="mt-8 space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Which accounts should this go to?
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((a) => {
            const active = selected.has(a.id);
            const cls =
              PLATFORM_COLORS[a.platform.toLowerCase()] ?? PLATFORM_COLORS.unknown;
            return (
              <label
                key={a.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  active ? "border-[color:var(--nx-blue)] bg-[color:var(--nx-blue)]/15" : "border-white/10 bg-white/5"
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
                <span className={`rounded px-1.5 py-0.5 text-xs ${cls}`}>
                  {platformLabel(a.platform)}
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
          Your message{" "}
          <span className="ml-1 font-normal text-slate-400">
            ({content.length} characters)
          </span>
        </label>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-[color:var(--nx-blue)]"
          placeholder="What do you want to share?"
        />
        {fieldErrors.content && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.content}</div>
        )}
        <div className="mt-3">
          <ScorePanel content={content} onAppendHashtags={appendHashtags} />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Photo or video link{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          name="mediaUrls"
          rows={2}
          placeholder="https://example.com/my-photo.jpg"
          className="block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
        />
        <p className="mt-1 text-xs text-slate-400">
          If your photo or video is already online, paste its link here. To add more than
          one, put each link on its own line. Uploading files straight from your phone or
          computer is coming soon.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">When should it go out?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="when"
            value="schedule"
            checked={when === "schedule"}
            onChange={() => setWhen("schedule")}
            className="accent-[color:var(--nx-blue)]"
          />
          At a time I choose
        </label>
        {when === "schedule" && (
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="ml-6 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
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
          Send it now
        </label>
      </fieldset>

      {state && !state.ok && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[color:var(--nx-blue)] px-6 py-2 font-medium text-white hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
      >
        {pending ? "Sending…" : when === "now" ? "Send now" : "Schedule post"}
      </button>
    </form>
  );
}

/** Hashtags can contain regex metacharacters, so they're escaped before use. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
