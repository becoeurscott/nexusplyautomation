import { Check } from "lucide-react";
import { Reveal } from "./reveal";

const INCLUDED = [
  "Connect every account and cross-post in one click",
  "Automated queue that publishes on your schedule",
  "Analytics, best time to post, and a unified inbox",
  "AI images, video, and voiceover generation",
  "Long-form video turned into a week of shorts",
  "A brand memory that keeps every AI output on-voice",
  "Trend and competitor research, built in",
  "Credits, not subscriptions to five different tools",
];

export function CapabilityMatrix() {
  return (
    <section className="nx-gradient-panel relative py-24">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Everything Included. Nothing Else to Buy.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            One subscription replaces the tool stack you're duct-taping together today.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-14 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--nx-blue)]">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
