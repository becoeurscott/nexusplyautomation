"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createPack, type PackResult } from "../actions";

/**
 * The "Generate my week / my month" form and its result.
 *
 * A 30-day pack costs 200 credits and takes a while (it's generated in chunks),
 * so the button says what it will cost before it's pressed and the pending state
 * says what's happening — a silent 40-second wait after spending 200 credits
 * reads as a broken page.
 */
export function PackGenerator() {
  const [state, submit, pending] = useActionState<PackResult | null, FormData>(
    createPack,
    null,
  );
  const [length, setLength] = useState<7 | 30>(7);
  const credits = length === 7 ? 50 : 200;

  return (
    <div>
      <form action={submit} className="nx-glass rounded-2xl p-6">
        <div className="flex flex-wrap gap-2">
          {([7, 30] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLength(n)}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (length === n
                  ? "bg-[color:var(--nx-blue)] text-white"
                  : "border border-white/15 text-slate-300 hover:bg-white/5")
              }
            >
              {n} days
            </button>
          ))}
        </div>
        <input type="hidden" name="length" value={length} />

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-slate-400">
            Tell us about the business — the more specific, the better the plan.
          </span>
          <textarea
            name="brief"
            rows={3}
            required
            placeholder="A primary school in Douala. We want more parents enquiring about admissions for the new term. Friendly, trustworthy tone."
            className="block w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-xl bg-[color:var(--nx-blue)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
        >
          {pending
            ? `Building your ${length} days…`
            : `Generate my ${length === 7 ? "week" : "month"} · ${credits} credits`}
        </button>

        {pending && length === 30 && (
          <p className="mt-2 text-xs text-slate-400">
            A month takes a minute or so — we write it in batches so nothing gets cut off.
          </p>
        )}

        {state && !state.ok && (
          <p className="mt-3 text-sm text-amber-300">{state.error}</p>
        )}
      </form>

      {state?.ok && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">
              Your {state.pack.days.length}-day plan
            </h2>
            <Link
              href="/app/compose"
              className="text-sm text-[color:var(--nx-blue-soft)] underline hover:text-white"
            >
              Go to Compose →
            </Link>
          </div>
          <PackDays pack={state.pack} />
        </div>
      )}
    </div>
  );
}

export function PackDays({
  pack,
}: {
  pack: { days: { day: number; idea: string; caption: string; visual: string; hashtags: string[]; slot: string }[] };
}) {
  return (
    <ul className="mt-4 space-y-3">
      {pack.days.map((d) => (
        <li key={d.day} className="nx-glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-xs font-bold text-[color:var(--nx-blue-soft)]">
                {d.day}
              </span>
              <span className="text-sm font-medium text-white">{d.idea}</span>
            </div>
            {d.slot && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                {d.slot}
              </span>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm text-slate-200">
            {d.caption}
          </p>

          {d.visual && (
            <p className="mt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Visual:</span> {d.visual}
            </p>
          )}

          {d.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {d.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          <CopyButton
            text={`${d.caption}${d.hashtags.length ? `\n\n${d.hashtags.join(" ")}` : ""}`}
          />
        </li>
      ))}
    </ul>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
    >
      {copied ? "Copied" : "Copy caption"}
    </button>
  );
}
