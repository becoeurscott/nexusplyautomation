"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * App-wide fade between distinct sections: landing ↔ sign-in ↔ sign-up ↔
 * dashboard shell. Every path under /app collapses to a single "app" key so
 * this doesn't re-fire on every dashboard sub-page — that's already handled
 * by the finer-grained `PageTransition` inside `app/app/layout.tsx`. Nesting
 * both would double-animate the same navigation.
 *
 * Deliberately NOT `mode="wait"` — see PageTransition's comment. Blocking on
 * an exit animation that a backgrounded tab may never fire would strand a
 * user on the previous section indefinitely.
 *
 * Because exit overlaps enter, both pages are mounted at once mid-transition.
 * They're placed in the SAME single grid cell so they stack visually rather
 * than flowing one after the other — without this, two `min-h-dvh` pages sit
 * end-to-end for the duration of the fade and the document height (and
 * scrollbar) visibly jumps on every navigation.
 */
function sectionKey(pathname: string): string {
  return pathname.startsWith("/app") ? "app" : pathname;
}

export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid min-h-dvh grid-cols-1 grid-rows-1">
      <AnimatePresence initial={false}>
        <motion.div
          key={sectionKey(pathname)}
          style={{ gridArea: "1 / 1" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // The outgoing copy must stop intercepting clicks the moment it
          // starts leaving — it's invisible but still on top of the stack.
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
