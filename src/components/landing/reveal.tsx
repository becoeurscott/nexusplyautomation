"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Framer-style appear-on-scroll. Mirrors the Nexus template's animation:
 * duration 0.4s, ease [0.16,1,0.3,1], y 20 → 0, opacity 0.001 → 1,
 * optional stagger via `delay` (template uses 0.2s steps).
 *
 * Because `.nx-reveal` starts at opacity 0.001, anything that stops the reveal
 * from completing leaves that content permanently invisible. Two guards, the
 * same pair used by `<StaggerGroup>`:
 *
 *  - If `IntersectionObserver` isn't available at all, reveal immediately
 *    rather than waiting for a callback that will never arrive.
 *  - Once an element starts revealing, a timer snaps it to the end state after
 *    the animation's own window. A CSS transition freezes mid-flight on a tab
 *    that isn't compositing frames, so this guarantees it lands even if not a
 *    single frame is painted.
 *
 * The settle timer deliberately starts on reveal, not on mount — starting it
 * at mount would force below-the-fold sections visible before the reader ever
 * scrolls to them, which is the whole effect this component exists to produce.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "span" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let revealed = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      el.classList.add("is-visible");
      // delay + 0.4s duration, plus margin.
      settleTimer = setTimeout(
        () => el.classList.add("is-settled"),
        delay * 1000 + 650,
      );
    };

    if (typeof IntersectionObserver !== "function") {
      reveal();
      return () => {
        if (settleTimer) clearTimeout(settleTimer);
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);

    // If no observer callback has arrived but the element is already sitting
    // in the viewport, reveal it anyway — the callback may never come (a tab
    // that has not composited a frame doesn't compute intersections). Scoped
    // to what's actually on screen so below-the-fold sections still wait for
    // the reader to scroll to them.
    const fallback = setTimeout(() => {
      if (revealed) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal();
    }, 1200);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [delay]);

  return (
    <Tag
      // @ts-expect-error — polymorphic ref is fine at runtime
      ref={ref}
      className={`nx-reveal ${className}`}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
