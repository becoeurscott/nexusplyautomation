import { Sparkles } from "lucide-react";

/**
 * Placeholder for a screen that isn't built yet.
 *
 * The previous version announced our internal roadmap ("Coming in Phase 3")
 * and described our own architecture to the customer. Neither means anything
 * to the people using this, so it says the useful part instead.
 */
export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#dbeafe] text-[color:var(--nx-blue)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="mt-4 text-lg font-semibold text-slate-800">Coming soon</div>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{blurb}</p>
      </div>
    </div>
  );
}
