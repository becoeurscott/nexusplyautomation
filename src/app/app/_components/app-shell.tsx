"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { StaggerGroup } from "@/components/motion-stagger";

/**
 * App chrome: a docked sidebar on desktop, an overlay drawer on phones.
 *
 * ── WHY THESE ARE TWO DIFFERENT BEHAVIOURS ───────────────────────────────────
 *
 * On a wide screen the nav is **open by default and displaces the content** —
 * it sits in the layout beside the page rather than floating over it, so
 * nothing is ever hidden behind it and there is no backdrop to dismiss.
 * Collapsing it hands the space back to the page, and the content reflows.
 *
 * On a phone there is no room to displace anything: a 260px column beside the
 * content would leave a unusable sliver. So below `lg` it stays an overlay with
 * a backdrop, closed by default, and it must be dismissible by the three routes
 * people reach for — the toggle, the backdrop, and Escape.
 *
 * This reverses the earlier "overlay at every breakpoint" behaviour, where
 * arriving on the dashboard showed no navigation at all until you found the
 * Menu button.
 *
 * `sidebar` and `header` arrive as already-rendered server nodes — this
 * component only owns the open/closed state, so nothing above it has to become
 * a client component.
 */

const LG = 1024; // Tailwind's lg breakpoint, where the nav docks.

export function AppShell({
  sidebar,
  header,
  children,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Mirrors `isDesktop` for effects that must not re-run when it changes, and
  // must not read a stale copy of it. See the navigation effect below.
  const isDesktopRef = useRef(false);

  // Resolved after mount, not during render: the server has no viewport, so
  // deciding this at render time would emit desktop markup to a phone (or the
  // reverse) and mismatch on hydration. First paint is the mobile layout —
  // which is also the safe one, since it never hides content behind a nav.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG}px)`);
    const apply = () => {
      isDesktopRef.current = mq.matches;
      setIsDesktop(mq.matches);
      // Docking on a wide screen opens the nav; narrowing closes it, so a
      // resize can't leave an overlay covering the page on a phone width.
      setOpen(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Navigating away should not leave the *drawer* sitting open over the page.
  // A docked desktop sidebar is part of the layout and stays exactly as it is.
  //
  // Reads the ref rather than the state, and depends on `pathname` alone, for
  // two reasons that both caused real bugs: with `isDesktop` in the deps this
  // fires on the mount pass where the state is still its initial `false` and
  // immediately closes the sidebar the media-query effect just opened; and
  // reading the state here would close it again on every later resize.
  useEffect(() => {
    if (!isDesktopRef.current) setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isDesktop]);

  const docked = isDesktop && open;

  return (
    <div className="nx-glow-top-strong relative min-h-dvh p-3 text-white lg:p-4">
      <div className="pointer-events-none absolute inset-0 nx-grid" aria-hidden />

      {/* Backdrop belongs to the overlay drawer only. On desktop the nav is
          part of the layout, so dimming the page behind it would be wrong. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 " +
          (open && !isDesktop ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />


      {/* The row that makes displacement work: when the sidebar is docked it is
          a sibling in this flex row, so the content column simply gets the
          remaining width. When it's a drawer it's `fixed`, out of flow, and the
          column takes everything. No margin juggling either way. */}
      <div className="relative mx-auto flex w-full max-w-[1600px] gap-4">
        <aside
          id="app-nav"
          aria-hidden={!open}
          // Sliding is a drawer behaviour, so the docked sidebar carries no
          // `translate` and no transition at all.
          //
          // Both details are load-bearing. Tailwind v4 compiles `translate-x-*`
          // to the `translate` property (which is why reading
          // `getComputedStyle().transform` here reports "none"), and leaving a
          // transition on that property across the dock/undock switch left a
          // CSSTransition permanently in `running` — pinning the panel at
          // -300px off-screen while it still occupied its slot in the row. A
          // running transition outranks even an `!important` inline style, so
          // nothing could override it. Not animating the docked state removes
          // the problem rather than fighting it.
          style={docked ? undefined : { translate: `${open ? 0 : -300}px 0` }}
          className={
            "nx-glass z-50 flex w-[260px] shrink-0 flex-col rounded-3xl p-4 " +
            (docked
              ? // Docked: a real column in the flex row, so the content beside
                // it simply gets the remaining width. Sticky rather than fixed
                // so it stays put as the page scrolls without leaving flow.
                "sticky top-4 max-h-[calc(100dvh-2rem)]"
              : // Drawer: lifted out of flow so the page keeps the full width.
                "fixed inset-y-3 left-3 transition-[translate] duration-300 ease-out lg:inset-y-4 lg:left-4")
          }
        >
          {/* Only the drawer needs a close affordance inside it — the docked
              sidebar is collapsed from the Menu button in the header. */}
          {!docked && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* The nav content (logo, links, workspace card, footer) is taller than
              the panel on any shorter viewport — a laptop with browser chrome, a
              landscape phone, a resized window — so it scrolls. min-h-0 is
              required: a flex child's default min-height is auto, which lets
              content push past the container instead of triggering this scroll. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{sidebar}</div>
        </aside>

        {/* Capped and centred so content doesn't run the full width of an
            ultrawide display in unreadably long rows. min-w-0 stops a wide
            child (a table, a long word) from forcing the column past its
            share and pushing the sidebar off screen. */}
        <StaggerGroup className="flex min-h-[calc(100dvh-2rem)] w-full min-w-0 flex-1 flex-col gap-4">
          <header className="nx-glass flex items-center justify-between gap-4 rounded-3xl px-4 py-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Hide menu" : "Show menu"}
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
        </StaggerGroup>
      </div>
    </div>
  );
}
