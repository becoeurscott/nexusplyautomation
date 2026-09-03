"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

/**
 * How much trial is left, in the top bar so it's visible on every screen.
 *
 * Precision scales with urgency rather than always ticking seconds: "9 days
 * left" is what you want a week out, and a stopwatch counting down from a week
 * is just pressure with no information in it. Inside the last day it switches
 * to a live h/m/s countdown, where the exact number genuinely matters.
 *
 * ── HYDRATION ────────────────────────────────────────────────────────────────
 *
 * The server and the browser never agree on "now", so computing remaining time
 * during render would produce a different string on each side and React would
 * warn about the mismatch. Instead `serverNowIso` is passed in and used for the
 * first render on both sides — deterministic, identical — and the live clock
 * only takes over in an effect, which runs after hydration.
 */

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function remainingFrom(endsAt: number, now: number): Remaining {
  const totalMs = Math.max(0, endsAt - now);
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function TrialTimer({
  endsAtIso,
  serverNowIso,
}: {
  endsAtIso: string;
  serverNowIso: string;
}) {
  const endsAt = new Date(endsAtIso).getTime();
  const [now, setNow] = useState(() => new Date(serverNowIso).getTime());

  useEffect(() => {
    setNow(Date.now());
    const left = endsAt - Date.now();
    // Tick every second only in the final day, where seconds are on screen.
    // Above that a per-second re-render would repaint the whole bar to change
    // nothing a person can see.
    const interval = left < DAY ? 1000 : 60_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!Number.isFinite(endsAt)) return null;

  const r = remainingFrom(endsAt, now);
  const expired = r.totalMs <= 0;

  const tone = expired
    ? "border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
    : r.totalMs < DAY
      ? "border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
      : r.totalMs < 3 * DAY
        ? "border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
        : "border-white/15 text-slate-200 hover:bg-white/10";

  const label = expired
    ? "Trial ended"
    : r.totalMs < DAY
      ? `${String(r.hours).padStart(2, "0")}:${String(r.minutes).padStart(2, "0")}:${String(r.seconds).padStart(2, "0")} left`
      : r.days < 2
        ? `1 day ${r.hours}h left`
        : `${r.days} days left`;

  return (
    <Link
      href="/app/settings"
      title={
        expired
          ? "Your free trial has ended — pick a plan to carry on"
          : `Free trial ends ${new Date(endsAt).toLocaleString()}`
      }
      className={
        "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition " +
        tone
      }
    >
      <Clock className="h-4 w-4 opacity-70" />
      {/* The countdown is the point on a phone, so only the word "trial" is
          dropped at narrow widths — never the number. */}
      <span className="hidden sm:inline">{expired ? "" : "Trial · "}</span>
      <span className={r.totalMs < DAY && !expired ? "font-mono tabular-nums" : ""}>
        {label}
      </span>
    </Link>
  );
}
