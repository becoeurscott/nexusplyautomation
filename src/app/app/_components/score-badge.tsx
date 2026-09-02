/**
 * A post's score, as a band rather than a bare number.
 *
 * "62" means nothing on its own — people need to know whether 62 is good. The
 * band and its colour do that job, the same way `StatusPill` turns a raw API
 * state into something readable. Colours reuse the semantic set already used
 * across the app (red / amber / blue / emerald) rather than inventing a new
 * score palette.
 */

export type ScoreBand = "needs_work" | "fair" | "good" | "great";

const BANDS: Record<ScoreBand, { label: string; className: string; ring: string }> = {
  needs_work: {
    label: "Needs work",
    className: "bg-red-500/15 text-red-300",
    ring: "#f87171",
  },
  fair: {
    label: "Fair",
    className: "bg-amber-400/15 text-amber-300",
    ring: "#fbbf24",
  },
  good: {
    label: "Good",
    className: "bg-[color:var(--nx-blue)]/20 text-[color:var(--nx-blue-soft)]",
    ring: "var(--nx-blue-soft)",
  },
  great: {
    label: "Great",
    className: "bg-emerald-500/15 text-emerald-300",
    ring: "#34d399",
  },
};

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "great";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "needs_work";
}

/** The stroke colour for a score ring, so the dial and the badge agree. */
export function scoreColor(score: number): string {
  return BANDS[scoreBand(score)].ring;
}

export function ScoreBadge({ score }: { score: number }) {
  const band = BANDS[scoreBand(score)];
  return (
    <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + band.className}>
      {band.label}
    </span>
  );
}

/**
 * Score as a ring. Deliberately the same 80×80 / r=34 / stroke-8 geometry as
 * `Dial` on the dashboard so the two read as one design, but with its own
 * colour-by-value behaviour that the credits dial has no use for.
 */
export function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms var(--e-out, ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-bold text-white">{Math.round(score)}</span>
      </div>
    </div>
  );
}
