"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Staggered entrance for forms and wizard steps, matching the landing page's
 * signature exactly — it runs on the same CSS curve as `.nx-reveal`
 * (duration 0.4s, ease [0.16,1,0.3,1], y 20 → 0, opacity 0.001 → 1).
 *
 * The landing uses `<Reveal>` (IntersectionObserver), which fires once when an
 * element scrolls into view. Forms and wizard steps instead need the effect to
 * replay whenever the content swaps, so these fire on mount.
 *
 * Deliberately CSS-driven rather than framer-motion: JS animation is driven by
 * requestAnimationFrame, which browsers throttle to a standstill on a hidden or
 * backgrounded tab. A stalled rAF leaves `animate` props pinned at their
 * initial values — which for an entrance means the whole form sits invisible at
 * opacity 0. A CSS transition still settles on its final computed value even
 * when not a single frame is painted, so the worst case is "appears without
 * animating" instead of "never appears".
 *
 * Per-child delays come from `:nth-child` in globals.css, so `<StaggerItem>` is
 * just a marker for "direct child of the group" — it carries no timing state.
 */
export function StaggerGroup({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [shown, setShown] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // Timers, not rAF — these must still fire on a backgrounded tab. The short
    // first delay lets the browser paint the pre-transition state, otherwise
    // both class states land in one style recalc and nothing animates.
    const start = setTimeout(() => setShown(true), 20);
    // Backstop: if the transition never actually ran (no frames composited
    // while hidden), force the end state once its window has passed so the
    // content can't be left invisible. Longest child delay (0.56s) + the 0.4s
    // duration, plus margin.
    const end = setTimeout(() => setSettled(true), (delay + 1.2) * 1000);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [delay]);

  return (
    <div
      className={`nx-stagger ${shown ? "is-shown" : ""} ${
        settled ? "is-settled" : ""
      } ${className}`}
      style={{ "--stagger-base": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** One staggered child. Must be a *direct* child of a `<StaggerGroup>`. */
export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
