"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/compose", label: "Compose", icon: MessageSquarePlus },
  { href: "/app/posts", label: "Posts", icon: ListChecks },
  { href: "/app/queue", label: "Queue", icon: Radar },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: "10" },
  { href: "/app/accounts", label: "Accounts", icon: Users2 },
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
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition " +
              (active
                ? "bg-[color:var(--nx-blue)] text-white shadow-[0_8px_20px_-8px_rgba(10,99,244,0.7)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
            }
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
            {item.badge && !active && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
