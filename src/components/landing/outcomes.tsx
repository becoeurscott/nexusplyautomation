import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section, Tile, Statements } from "./section";

const OUTCOMES = [
  {
    title: "Build trust",
    body: "Show people that your business is active, professional and credible.",
  },
  { title: "Stay visible", body: "Remain in front of your audience consistently." },
  {
    title: "Generate interest",
    body: "Turn attention into website visits, inquiries and potential customers.",
  },
  {
    title: "Strengthen your brand",
    body: "Create a recognizable voice and visual identity.",
  },
  {
    title: "Save time",
    body: "Replace repetitive social-media tasks with one organized workflow.",
  },
];

export function Outcomes() {
  return (
    <Section
      title="Don't just post."
      lead="Build a social presence that works for your business."
      sub="Posting consistently is only part of the equation. Your social media should help you:"
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OUTCOMES.map((o, i) => (
          <Tile key={o.title} title={o.title} body={o.body} index={i} />
        ))}
      </div>
    </Section>
  );
}

const SHOULDNT = [
  "You shouldn't have to spend your evening creating tomorrow's Instagram post.",
  "You shouldn't have to remember which platform needs an update.",
  "You shouldn't have to manually copy and paste the same content everywhere.",
  "You shouldn't have to stare at a blank content calendar wondering what to publish.",
];

const AGENCY_COSTS = [
  "Content",
  "Design",
  "Scheduling",
  "Reporting",
  "Community management",
  "Strategy",
  "Multiple tools",
  "Multiple subscriptions",
];

export function VsAgency() {
  return (
    <Section
      title="A social media team without the agency complexity."
      sub="Traditional social-media management can become expensive quickly."
    >
      {/* Absorbed from the old "Your business has enough to do" section — it
          made the same argument immediately before this one. */}
      <Statements lines={SHOULDNT} />

      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="font-display text-2xl font-bold text-white sm:text-3xl">
          Let NexusPly handle the busywork.
        </p>
        <p className="mt-3 text-slate-400">
          You provide the business. We help handle the social presence.
        </p>
      </Reveal>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
        {AGENCY_COSTS.map((c, i) => (
          <Reveal key={c} delay={Math.min(i * 0.04, 0.3)}>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-slate-400">
              {c}
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-lg text-slate-400">
          NexusPly brings the workflow together into one managed platform.
        </p>
        <p className="font-display mt-5 text-2xl font-bold text-white sm:text-3xl">
          One system. One dashboard. One social presence.
        </p>
        <div className="mt-8">
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
        </div>
      </Reveal>
    </Section>
  );
}
