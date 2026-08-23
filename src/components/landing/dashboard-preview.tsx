import { Coins, Menu, Send } from "lucide-react";

/**
 * The hero visual: a rendering of the actual dashboard rather than a
 * screenshot.
 *
 * It previously used a stock image shipped with the template, which showed a
 * product that doesn't exist — a different layout, different colours, and
 * features we don't have. Building it from markup keeps the marketing shot
 * honest, costs no image weight, stays sharp at any density, and follows the
 * brand tokens if they change.
 *
 * It is decorative, so the whole thing is hidden from assistive tech; the
 * surrounding copy already describes the product.
 */
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none overflow-hidden rounded-[12px] bg-[color:var(--nx-bg)] p-3 sm:p-4"
    >
      {/* Top bar */}
      <div className="nx-glass flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
        <span className="flex items-center gap-2 rounded-full border border-white/15 px-2.5 py-1.5 text-[10px] font-medium text-slate-200">
          <Menu className="h-3 w-3" /> Menu
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--nx-blue)] px-2.5 py-1.5 text-[10px] font-semibold text-white">
            <Send className="h-3 w-3" /> Create post
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-white/15 px-2.5 py-1.5 text-[10px] text-slate-300 sm:flex">
            <Coins className="h-3 w-3" /> 500
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-[9px] font-bold text-[color:var(--nx-blue-soft)]">
            AK
          </span>
        </div>
      </div>

      {/* Row 1 */}
      <div className="mt-3 grid gap-3 sm:grid-cols-12">
        <div className="relative self-start overflow-hidden rounded-2xl bg-[color:var(--nx-blue)] p-4 sm:col-span-5">
          <div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="font-display text-base font-bold text-white">Hi, Amina</div>
            <p className="mt-0.5 text-[10px] text-white/80">Bright Star Academy</p>
            <span className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-medium text-white">
              Free trial · 14 days left
            </span>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              {[
                ["6", "Accounts"],
                ["48", "Posts"],
                ["9", "Lined up"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-lg bg-white/15 px-1 py-1.5">
                  <div className="text-xs font-bold leading-none text-white">{v}</div>
                  <div className="mt-0.5 text-[8px] text-white/75">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nx-glass rounded-2xl p-4 sm:col-span-3">
          <div className="text-[10px] font-semibold text-white">Credits</div>
          <div className="relative mx-auto mt-3 grid h-16 w-16 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="8"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--nx-blue-soft)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * 0.32}
              />
            </svg>
            <div className="text-center">
              <div className="text-sm font-bold leading-none text-white">340</div>
            </div>
          </div>
        </div>

        <div className="nx-glass rounded-2xl p-4 sm:col-span-4">
          <div className="text-[10px] font-semibold text-white">Getting started</div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/12">
            <div className="h-full w-2/3 rounded-full bg-[color:var(--nx-blue-soft)]" />
          </div>
          <div className="mt-3 space-y-1.5">
            {["Connect your accounts", "Create your first post", "Schedule something"].map(
              (l, i) => (
                <div
                  key={l}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5"
                >
                  <span
                    className={
                      "h-3 w-3 shrink-0 rounded-full " +
                      (i < 2 ? "bg-emerald-500" : "border border-white/25")
                    }
                  />
                  <span className="truncate text-[9px] text-slate-300">{l}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="mt-3 grid gap-3 sm:grid-cols-12">
        <div className="nx-glass rounded-2xl p-4 sm:col-span-8">
          <div className="text-[10px] font-semibold text-white">Going out next</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["Scheduled", "Term 2 admissions are now open —"],
              ["Waiting to go out", "Meet the teachers behind our science"],
              ["Scheduled", "Five reasons parents choose us"],
              ["Waiting to go out", "Sports day highlights are up"],
            ].map(([status, text], i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2.5">
                <span className="rounded-full bg-[color:var(--nx-blue)]/20 px-1.5 py-0.5 text-[8px] font-medium text-[color:var(--nx-blue-soft)]">
                  {status}
                </span>
                <p className="mt-1.5 line-clamp-2 text-[9px] text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="nx-glass rounded-2xl p-4 sm:col-span-4">
          <div className="text-[10px] font-semibold text-white">Your results</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["12.4k", "Views"],
              ["842", "Likes"],
              ["96", "Comments"],
              ["4.1%", "Engagement"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-white/5 p-2 text-center">
                <div className="text-xs font-bold text-white">{v}</div>
                <div className="mt-0.5 text-[8px] text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
