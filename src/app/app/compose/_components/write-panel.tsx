"use client";

import { useState, useTransition } from "react";
import {
  writeCaption,
  writeCarousel,
  writeIdeas,
  writeLongForm,
  writeRewrite,
} from "../write-actions";

type Mode = "idea" | "caption" | "rewrite" | "long" | "carousel";

const MODES: { key: Mode; label: string; credits: number; needsDraft?: boolean }[] = [
  { key: "idea", label: "Give me ideas", credits: 1 },
  { key: "caption", label: "Write a caption", credits: 1 },
  { key: "rewrite", label: "Rewrite mine", credits: 1, needsDraft: true },
  { key: "long", label: "Long-form post", credits: 2 },
  { key: "carousel", label: "Carousel", credits: 3 },
];

/**
 * "Write it for me" — the drafting tools, inline in Compose.
 *
 * Not a `<form>`: this sits inside the compose form, and nesting forms is
 * invalid HTML that breaks the outer submit. It calls the server actions
 * directly via `useTransition`.
 *
 * Results are never written straight into the post. They're shown first with an
 * explicit "Use this", because these tools cost credits and overwriting
 * someone's draft without asking is how you lose work they'd already typed.
 */
export function WritePanel({
  content,
  onUse,
}: {
  content: string;
  onUse: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("caption");
  const [brief, setBrief] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = MODES.find((m) => m.key === mode)!;
  const hasDraft = content.trim().length >= 10;
  const blocked = active.needsDraft ? !hasDraft : brief.trim().length < 3;

  function run() {
    setError(null);
    setText(null);
    setItems(null);
    startTransition(async () => {
      switch (mode) {
        case "idea": {
          const r = await writeIdeas(brief);
          r.ok ? setItems(r.items) : setError(r.error);
          break;
        }
        case "caption": {
          const r = await writeCaption(brief);
          r.ok ? setText(r.text) : setError(r.error);
          break;
        }
        case "rewrite": {
          const r = await writeRewrite(content, brief);
          r.ok ? setText(r.text) : setError(r.error);
          break;
        }
        case "long": {
          const r = await writeLongForm(brief);
          r.ok ? setText(r.text) : setError(r.error);
          break;
        }
        case "carousel": {
          const r = await writeCarousel(brief);
          r.ok ? setItems(r.items) : setError(r.error);
          break;
        }
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-300 transition hover:border-[color:var(--nx-blue-soft)] hover:text-white"
      >
        Not sure what to write? Let NexusPly draft it →
      </button>
    );
  }

  return (
    <div className="nx-glass-soft rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Write it for me</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Costs {active.credits} credit{active.credits === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 underline hover:text-white"
        >
          Hide
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => {
              setMode(m.key);
              setText(null);
              setItems(null);
              setError(null);
            }}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition " +
              (mode === m.key
                ? "bg-[color:var(--nx-blue)] text-white"
                : "border border-white/15 text-slate-300 hover:bg-white/5")
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={2}
        placeholder={
          mode === "rewrite"
            ? "How should it change? e.g. shorter, friendlier, more urgent (optional)"
            : mode === "idea"
              ? "What does the business do? e.g. a primary school in Douala"
              : "What's it about? e.g. open day this Saturday, parents welcome"
        }
        className="mt-3 block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
      />

      {mode === "rewrite" && !hasDraft && (
        <p className="mt-2 text-xs text-slate-500">
          Write something in the post box above first, then we can rewrite it.
        </p>
      )}

      <button
        type="button"
        onClick={run}
        disabled={pending || blocked}
        className="mt-3 rounded-lg bg-[color:var(--nx-blue)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
      >
        {pending ? "Writing…" : active.label}
      </button>

      {error && <p className="mt-3 text-xs text-amber-300">{error}</p>}

      {text && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm text-slate-200">
            {text}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onUse(text)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {items && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-xl bg-white/5 p-3"
              >
                <span className="text-sm text-slate-200">
                  {mode === "carousel" && (
                    <span className="mr-2 text-xs font-semibold text-[color:var(--nx-blue-soft)]">
                      {i + 1}.
                    </span>
                  )}
                  {it}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUse(
                      mode === "carousel"
                        ? items.map((s, n) => `${n + 1}. ${s}`).join("\n\n")
                        : it,
                    )
                  }
                  className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white transition hover:bg-white/15"
                >
                  {mode === "carousel" ? "Use all" : "Use"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
