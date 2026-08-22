"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquarePlus,
  Radar,
  Settings,
  Users2,
} from "lucide-react";

/**
 * Labels are deliberately everyday words rather than product jargon —
 * "Create post" over "Compose", "Results" over "Analytics".
 *
 * The Inbox entry used to carry a hardcoded "10" badge, so every account was
 * permanently told it had ten unread messages. A count we can't actually
 * measure yet is worse than no count.
 */
const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/compose", label: "Create post", icon: MessageSquarePlus },
  { href: "/app/posts", label: "My posts", icon: ListChecks },
  { href: "/app/queue", label: "Schedule", icon: Radar },
  { href: "/app/analytics", label: "Results", icon: BarChart3 },
  { href: "/app/inbox", label: "Messages", icon: Inbox },
  { href: "/app/accounts", label: "My accounts", icon: Users2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="relative block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className={
                "relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 " +
                (active ? "" : "hover:bg-slate-50")
              }
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-[color:var(--nx-blue)] shadow-[0_8px_20px_-8px_rgba(10,99,244,0.7)]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span
                className={
                  "relative z-10 flex items-center gap-3 transition-colors duration-200 " +
                  (active ? "text-white" : "text-slate-600")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
