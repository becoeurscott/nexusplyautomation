"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * App-wide fade between distinct sections: landing ↔ sign-in ↔ sign-up ↔
 * dashboard shell. Every path under /app collapses to a single "app" key so
 * this doesn't re-fire on every dashboard sub-page — that's already handled
 * by the finer-grained `PageTransition` inside `app/app/layout.tsx`. Nesting
 * both would double-animate the same navigation.
 */
function sectionKey(pathname: string): string {
  return pathname.startsWith("/app") ? "app" : pathname;
}

export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sectionKey(pathname)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
