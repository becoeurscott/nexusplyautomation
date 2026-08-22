"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Fades + lifts each dashboard page in on navigation. Keyed by pathname so
 * AnimatePresence treats every route as a distinct entering/exiting node.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
