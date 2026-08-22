import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import {
  Building2,
  Coins,
  LayoutDashboard,
  ToggleLeft,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/flags", label: "Feature flags", icon: ToggleLeft },
  { href: "/admin/credits", label: "Credit ledger", icon: Coins },
];

/**
 * Operator-only shell. Deliberately not reachable from any link inside the
 * customer app — bookmark this URL directly. Gated by `requireAdmin()`.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-dvh bg-[#0b0f19] text-slate-100">
      <div className="grid min-h-dvh grid-cols-[220px_1fr]">
        <aside className="border-r border-white/10 bg-[#0e1320] p-4">
          <div className="mb-6 px-2">
            <div className="font-display text-sm font-bold uppercase tracking-widest text-slate-500">
              Nexusply Ops
            </div>
            <div className="mt-0.5 text-xs text-slate-600">{session.user.email}</div>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
