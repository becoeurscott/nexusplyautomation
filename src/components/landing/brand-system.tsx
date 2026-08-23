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

      {/* The weekly plan was its own section; it is the evidence for the claim
          above, so it reads better attached to it than as a separate scroll. */}
      <Reveal className="mx-auto mt-16 max-w-2xl text-center">
        <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
          From &ldquo;I need to post something&rdquo; to an entire content system.
        </h3>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="mt-3 text-xs text-slate-500">
            14-day trial · No card required · Cancel any time
          </p>
        </div>
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
