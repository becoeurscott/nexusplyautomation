"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Fades + lifts each dashboard page in on navigation. Keyed by pathname so
 * AnimatePresence treats every route as a distinct entering/exiting node.
 *
 * Deliberately NOT `mode="wait"` — that blocks mounting the new page until
 * the old one's exit animation completes via requestAnimationFrame, which
 * browsers throttle or pause entirely on a backgrounded/hidden tab. A user
 * who navigates while their tab isn't focused would get stuck on the old
 * page forever. Overlapping enter/exit is a fine tradeoff for correctness.
 *
 * The overlap means both pages are mounted together mid-transition, so they
 * share one grid cell and stack visually instead of flowing end-to-end —
 * otherwise the scroll height doubles for the length of the animation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid grid-cols-1 grid-rows-1">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          style={{ gridArea: "1 / 1" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          // Stop the outgoing page from swallowing clicks while it fades.
          exit={{ opacity: 0, y: -8, pointerEvents: "none" }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
