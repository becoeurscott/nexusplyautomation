import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { SignOutButton } from "./_components/sign-out-button";
import { SidebarNav } from "./_components/sidebar-nav";
import { PageTransition } from "./_components/page-transition";
import { TopBarActions } from "./_components/top-bar-actions";
import { Search, HelpCircle } from "lucide-react";

/**
 * Light app shell matching the reference mockup:
 * white sidebar with blue active pill, soft-blue page ground, rounded white cards,
 * top bar with search / share / invite / bell / avatar.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, workspace } = await requireWorkspace();
  const initials = (session.user.name ?? session.user.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-[#eef2f9] p-3 text-slate-900 lg:p-4">
      <div className="grid min-h-[calc(100dvh-2rem)] gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col rounded-3xl bg-white p-4">
          <div className="mb-6 flex items-center justify-between px-2">
            <Link href="/app" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white">
                <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden>
                  <path
                    d="M6 24 L6 8 L12 8 L12 18 L20 8 L26 8 L26 24 L20 24 L20 14 L12 24 Z"
                    fill="#fff"
                  />
                </svg>
              </span>
              <span className="font-display text-[15px] font-bold">Nexusply</span>
            </Link>
          </div>

          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            General
          </div>
          <SidebarNav />

          <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            My workspace
          </div>
          <div className="mx-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs">
            <div className="text-slate-500">Active</div>
            <div className="mt-0.5 truncate font-semibold text-slate-800">{workspace.name}</div>
          </div>

          <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
            <Link
              href="/app/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <HelpCircle className="h-4 w-4" /> Help Center
            </Link>
            <SignOutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-3">
            <label className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-[color:var(--nx-blue)]"
              />
            </label>
            <TopBarActions
              initials={initials}
              name={session.user.name ?? "You"}
              email={session.user.email}
            />
          </header>

          <main className="flex-1 overflow-hidden rounded-3xl bg-white p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
