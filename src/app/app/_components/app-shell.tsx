"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * App chrome with a collapsible navigation drawer.
 *
 * The nav is hidden by default at every breakpoint and opens over the content
 * rather than displacing it, so the working area is the full width on a laptop
 * as well as a phone. Because it's an overlay, it must be dismissible by the
 * three routes people reach for: the toggle, the backdrop, and Escape.
 *
 * `sidebar` and `header` arrive as already-rendered server nodes — this
 * component only owns the open/closed state, so nothing above it has to
 * become a client component.
 */
export function AppShell({
  sidebar,
  header,
  children,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating away should not leave the drawer sitting open over the page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="nx-glow-top-strong relative min-h-dvh p-3 text-white lg:p-4">
      <div className="pointer-events-none absolute inset-0 nx-grid" aria-hidden />

      {/* Backdrop — only interactive while the drawer is open, so it never
          swallows clicks on the dashboard behind it. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />

      <aside
        id="app-nav"
        aria-hidden={!open}
        className={
          "nx-glass fixed inset-y-3 left-3 z-50 flex w-[260px] flex-col rounded-3xl p-4 transition-transform duration-300 ease-out lg:inset-y-4 lg:left-4 " +
          // 300px clears the 260px panel plus its left inset (12px, 16px at
          // lg) at both breakpoints. Note this compiles to the `translate`
          // property, not `transform` — checking `getComputedStyle().transform`
          // here reports "none" even while the panel is correctly offset.
          (open ? "translate-x-0" : "-translate-x-[300px]")
        }
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebar}
      </aside>

      {/* Capped and centred: with the nav now an overlay rather than a column,
          content otherwise ran the full width of an ultrawide display, giving
          unreadably long rows. The header shares the wrapper so the two stay
          aligned. */}
      <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[1600px] flex-col gap-4">
        <header className="nx-glass flex items-center justify-between gap-4 rounded-3xl px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="app-nav"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
          {header}
        </header>

        <main className="flex-1 rounded-3xl">{children}</main>
      </div>
    </div>
  );
}
