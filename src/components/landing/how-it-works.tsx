import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section } from "./section";

const STEPS = [
  {
    title: "Connect your accounts",
    body: "Connect the social platforms you want to manage.",
  },
  {
    title: "Tell us about your business",
    body: "Your industry, audience, offers, tone and goals.",
  },
  {
    title: "Build your content system",
    body: "Create your content direction and publishing calendar.",
  },
  {
    title: "Review your content",
    body: "Make sure everything represents your business.",
  },
  {
    title: "Let NexusPly handle the workflow",
    body: "Scheduling, publishing, organization and repetitive tasks happen automatically.",
  },
  {
    title: "Watch your results",
    body: "Use performance data to understand what's getting attention.",
  },
];

/**
 * The ongoing cycle, previously its own "Your social media works while you
 * work" section. It restated the setup steps above, so it lives here as the
 * "and then it repeats" coda rather than a second full section.
 */
const LOOP = ["Create", "Approve", "Schedule", "Publish", "Analyze", "Improve"];

export function HowItWorks() {
  return (
    <Section id="how-it-works" title="How NexusPly works">
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={Math.min(i * 0.05, 0.3)}>
            <article className="nx-card nx-card--soft h-full p-6">
              <span className="font-display text-3xl font-bold text-[color:var(--nx-blue)]">
                {i + 1}
              </span>
              <h3 className="font-display mt-3 text-lg font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12">
        <div className="nx-card nx-card--soft p-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[color:var(--nx-blue-soft)]">
            Then your social media works while you work
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-white">
            {LOOP.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-white/8 px-4 py-2">{s}</span>
                {i < LOOP.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-12 text-center">
        <Tap>
          <Link
            href="/sign-up"
            className="inline-block rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
          >
            Start Your Free Trial
          </Link>
        </Tap>
        <p className="mt-3 text-xs text-slate-500">
          14-day trial · No card required · Cancel any time
        </p>
      </Reveal>
    </Section>
  );
}
