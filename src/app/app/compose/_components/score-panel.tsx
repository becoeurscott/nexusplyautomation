"use client";

import { useState, useTransition } from "react";
import { ScoreBadge, ScoreRing } from "../../_components/score-badge";
import { Bar } from "../../_components/dashboard-ui";
import {
  scorePost,
  suggestHashtags,
  type ScoreResult,
  type HashtagResult,
} from "../score-actions";

/**
 * "Check this post" — the score and hashtag suggestions, inline in Compose.
 *
 * Not a `<form>`: this sits *inside* the compose form, and a nested form is
 * invalid HTML that would break the outer submit. It calls the server actions
 * directly through `useTransition` instead, reading the caller's live `content`
 * state so scoring always reflects what's actually in the textarea.
 *
 * Both actions cost 1 credit, which the copy says out loud — a button that
 * silently spends is a button people learn to distrust.
 */
export function ScorePanel({
  content,
  onAppendHashtags,
}: {
  content: string;
  onAppendHashtags: (tags: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [tags, setTags] = useState<HashtagResult | null>(null);
  const [pending, startTransition] = useTransition();

  const tooShort = content.trim().length < 10;

  function runScore() {
    startTransition(async () => {
      setScore(await scorePost(content));
    });
  }

  function runHashtags() {
    startTransition(async () => {
      setTags(await suggestHashtags(content));
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-300 transition hover:border-[color:var(--nx-blue-soft)] hover:text-white"
      >
        Check this post before you send it →
      </button>
    );
  }

  return (
    <div className="nx-glass-soft rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Check this post</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            See how strong it is and what to fix. 1 credit each.
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

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runScore}
          disabled={pending || tooShort}
          className="rounded-lg bg-[color:var(--nx-blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
        >
          {pending ? "Working…" : score?.ok ? "Score again" : "Score this post"}
        </button>
        <button
          type="button"
          onClick={runHashtags}
          disabled={pending || tooShort}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/5 disabled:opacity-50"
        >
          Suggest hashtags
        </button>
      </div>

      {tooShort && (
        <p className="mt-2 text-xs text-slate-500">
          Write a bit more first, then we can check it.
        </p>
      )}

      {score && !score.ok && (
        <p className="mt-3 text-xs text-amber-300">{score.error}</p>
      )}

      {score?.ok && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={score.score} />
            <div className="min-w-0">
              <ScoreBadge score={score.score} />
              {score.summary && (
                <p className="mt-2 text-sm text-slate-300">{score.summary}</p>
              )}
            </div>
          </div>

          {score.factors.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {score.factors.map((f) => (
                <li key={f.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{f.label}</span>
                    <span className="font-mono text-slate-400">{f.score}</span>
                  </div>
                  <div className="mt-1">
                    <Bar pct={f.score} tone={f.score < 60 ? "amber" : "blue"} />
                  </div>
                  {f.note && <p className="mt-1 text-xs text-slate-500">{f.note}</p>}
                </li>
              ))}
            </ul>
          )}

          {score.fixes.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What to change
              </div>
              <ul className="mt-2 space-y-1.5">
                {score.fixes.map((fix, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-[color:var(--nx-blue-soft)]">→</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tags && !tags.ok && <p className="mt-3 text-xs text-amber-300">{tags.error}</p>}

      {tags?.ok && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Suggested hashtags
            </div>
            {tags.hashtags.length > 0 && (
              <button
                type="button"
                onClick={() => onAppendHashtags(tags.hashtags)}
                className="text-xs text-[color:var(--nx-blue-soft)] underline hover:text-white"
              >
                Add all to post
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.hashtags.map((h) => (
              <span
                key={h}
                className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300"
              >
                {h}
              </span>
            ))}
          </div>
          {tags.keywords.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              People search for: {tags.keywords.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
