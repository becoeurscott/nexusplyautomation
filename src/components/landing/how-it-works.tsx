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

      <Reveal className="mt-12 text-center">
        <Tap>
          <Link
            href="/sign-up"
            className="inline-block rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
          >
            Get Started
          </Link>
        </Tap>
      </Reveal>
    </Section>
  );
}
