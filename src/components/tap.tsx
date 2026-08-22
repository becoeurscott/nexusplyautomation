"use client";

import { motion } from "framer-motion";

/**
 * Wraps any link/button/anchor with a quick scale-down on click.
 * Works from server components since only this wrapper needs "use client" —
 * pass a plain `<Link>` or `<a>` as children.
 */
export function Tap({
  children,
  className = "inline-block",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }} className={className}>
      {children}
    </motion.div>
  );
}
