import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { getBalance } from "@/lib/credits";
import { getTrialState } from "@/lib/billing/trial";
import { SignOutButton } from "./_components/sign-out-button";
import { SidebarNav } from "./_components/sidebar-nav";
import { PageTransition } from "./_components/page-transition";
import { TopBarActions } from "./_components/top-bar-actions";
import { AppShell } from "./_components/app-shell";
import { HelpCircle } from "lucide-react";

/**
 * Dark "liquid glass" app shell: frosted translucent panels over the brand
 * navy gradient, matching the marketing site so the app and the site read as
 * one product. The same `nx-glow-top-strong` + `nx-grid` treatment is used by
 * the landing, auth and onboarding screens.
 *
 * Stays a server component — `AppShell` owns the drawer's open/closed state
 * and receives the nav and top bar as already-rendered nodes.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, workspace } = await requireWorkspace();
  const balance = await getBalance(workspace.id);
  const trial = await getTrialState(workspace.id);
  // Only a live trial gets a countdown. Showing one to a paying customer would
  // be alarming and meaningless — their subscription renews, it doesn't run out.
  const trialEndsAtIso =
    trial?.status === "trialing" && trial.endsAt ? trial.endsAt.toISOString() : null;
  const initials = (session.user.name ?? session.user.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <>
      <div className="mb-6 flex items-center justify-between px-2">
        <Link href="/app" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--nx-blue)] text-white">
            <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden>
              <path
                d="M6 24 L6 8 L12 8 L12 18 L20 8 L26 8 L26 24 L20 24 L20 14 L12 24 Z"
                fill="#fff"
              />
            </svg>
          </span>
          <span className="font-display text-[15px] font-bold">NexusPly</span>
        </Link>
      </div>

      <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Menu
      </div>
      <SidebarNav />

      <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        My workspace
      </div>
      <div className="nx-glass-soft mx-1 rounded-xl px-3 py-2.5 text-xs">
        <div className="text-slate-400">Active</div>
        <div className="mt-0.5 truncate font-semibold text-white">{workspace.name}</div>
      </div>

      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        {/* This said "Help Center" but pointed at Settings. Several screens
            now tell people to contact support, so it needs to actually
            reach someone — same address as the site footer. */}
        <a
          href="mailto:hello@nexusply.ai"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          <HelpCircle className="h-4 w-4" /> Get help
        </a>
        <SignOutButton />
      </div>
    </>
  );

  return (
    <AppShell
      sidebar={sidebar}
      header={
        <TopBarActions
          initials={initials}
          name={session.user.name ?? "You"}
          email={session.user.email}
          balance={balance}
          trialEndsAtIso={trialEndsAtIso}
          serverNowIso={new Date().toISOString()}
        />
      }
    >
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
