import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section, Tile } from "./section";

/**
 * One capability list.
 *
 * The copy carried two overlapping lists — "One place to manage your entire
 * social presence" (7 items) and "What NexusPly can handle" (10) — which
 * repeated scheduling, publishing, engagement, analytics and automation. This
 * is the union of both, keeping the sharper description wherever they differed.
 */
const CAPABILITIES = [
  { title: "Strategy", body: "Create a content direction around your business goals." },
  {
    title: "Content Planning",
    body: "Build a consistent content calendar around your business, offers and audience.",
  },
  { title: "Content Ideas", body: "Never run out of things to talk about." },
  {
    title: "Captions",
    body: "Create platform-appropriate messaging that fits your brand.",
  },
  {
    title: "Visual Content",
    body: "Prepare social-ready creative for your content calendar.",
  },
  {
    title: "Multi-Platform Publishing",
    body: "Prepare content once and distribute it across the social channels your business uses.",
  },
  {
    title: "Scheduling",
    body: "Plan your content ahead of time and keep your accounts active automatically.",
  },
  {
    title: "Engagement Management",
    body: "Keep track of comments and customer conversations so important interactions don't get missed.",
  },
  {
    title: "Performance Insights",
    body: "Understand what's working, what isn't and where to focus your effort.",
  },
  {
    title: "Business Automation",
    body: "Connect your social media activity to the rest of your business workflow.",
  },
];

export function Capabilities() {
  return (
    <Section
      id="features"
      title="One place to manage your entire social presence."
      sub="Connect your social accounts and let NexusPly handle the repetitive work."
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <Tile key={c.title} title={c.title} body={c.body} index={i} />
        ))}
      </div>

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
