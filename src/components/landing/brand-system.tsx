import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section, Accent } from "./section";

const BRAND_INPUTS = [
  "Brand voice",
  "Business goals",
  "Audience",
  "Services",
  "Offers",
  "Industry",
  "Content style",
];

export function BrandVoice() {
  return (
    <Section
      title={
        <>
          Content that feels like <Accent>your brand</Accent>.
        </>
      }
      sub="Your business shouldn't sound like everyone else online. NexusPly works around your:"
    >
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
        {BRAND_INPUTS.map((b, i) => (
          <Reveal key={b} delay={Math.min(i * 0.05, 0.3)}>
            <span className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200">
              {b}
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-lg text-slate-400">
          The goal isn&apos;t to publish more random posts.
        </p>
        <p className="font-display mt-4 text-2xl font-bold text-white sm:text-3xl">
          The goal is to build a recognizable presence.
        </p>
        <p className="mt-4 text-slate-400">
          Your audience should know when they&apos;re seeing your content.
        </p>
      </Reveal>
    </Section>
  );
}

const WEEK = [
  { day: "Monday", body: "Educational content." },
  { day: "Tuesday", body: "Customer-focused content." },
  { day: "Wednesday", body: "Brand story." },
  { day: "Thursday", body: "Industry insight." },
  { day: "Friday", body: "Offer or promotional content." },
  { day: "Weekend", body: "Community and engagement content." },
];

export function ContentSystem() {
  return (
    <Section
      title="From “I need to post something” to an entire content system."
      tone="glow"
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WEEK.map((d, i) => (
          <Reveal key={d.day} delay={Math.min(i * 0.05, 0.3)}>
            <article className="nx-card nx-card--soft h-full p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-[color:var(--nx-blue-soft)]">
                {d.day}
              </div>
              <p className="mt-2 text-base text-slate-200">{d.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-lg text-slate-400">
          Instead of deciding what to post every morning, your social presence has a
          plan.
        </p>
        <div className="mt-8">
          <Tap>
            <Link
              href="/sign-up"
              className="inline-block rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
            >
              Build My Content System
            </Link>
          </Tap>
        </div>
      </Reveal>
    </Section>
  );
}

const LOOP = [
  {
    title: "Create",
    body: "Turn your ideas, services, promotions and expertise into social content.",
  },
  { title: "Approve", body: "Review your content before it goes live." },
  { title: "Schedule", body: "Set your publishing calendar once." },
  {
    title: "Publish",
    body: "Your approved content goes out according to your schedule.",
  },
  { title: "Analyze", body: "See which content gets attention and engagement." },
  {
    title: "Improve",
    body: "Use the results to continuously improve your content strategy.",
  },
];

export function WorkLoop() {
  return (
    <Section title="Your social media works while you work.">
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <Reveal key={s.title} delay={Math.min(i * 0.05, 0.3)}>
            <article className="nx-card nx-card--soft h-full p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--nx-blue)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function Approval() {
  return (
    <Section
      title="Your approval always comes first."
      sub="NexusPly isn't about taking control away from your brand. You stay in control."
      narrow
    >
      <Reveal className="mt-10">
        <div className="nx-card nx-card--soft p-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-white sm:text-base">
            {["Create", "Review", "Approve", "Publish"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-[color:var(--nx-blue)]/15 px-4 py-2 text-[color:var(--nx-blue-soft)]">
                  {s}
                </span>
                {i < 3 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
          <div className="mt-7 space-y-2 text-slate-400">
            <p>Review your content before publication.</p>
            <p>Make changes when necessary.</p>
            <p>Approve what represents your business.</p>
            <p>Then let the system handle the repetitive work.</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
