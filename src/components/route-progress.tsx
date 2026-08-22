"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin top-of-viewport progress bar that pulses on every route change.
 * App Router doesn't expose navigation-start/end events, so this fakes the
 * feel: show immediately on pathname change, race a quick fill, fade out.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const done = setTimeout(() => setActive(false), 380);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="progress"
          className="fixed left-0 top-0 z-[200] h-[3px] w-full origin-left bg-[color:var(--nx-blue,#2563eb)]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, opacity: 1 }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ boxShadow: "0 0 12px rgba(37,99,235,0.8)" }}
        />
      )}
    </AnimatePresence>
  );
}
