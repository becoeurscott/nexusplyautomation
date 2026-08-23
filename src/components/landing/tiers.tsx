import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Section, Tile } from "./section";

const TIERS = [
  {
    name: "SOCIAL",
    items: [
      "Content planning",
      "Content creation",
      "Scheduling",
      "Publishing",
      "Content calendar",
      "Basic analytics",
    ],
  },
  {
    name: "ENGAGE",
    items: [
      "Comment management",
      "Message management",
      "Lead notifications",
      "Customer follow-up workflows",
    ],
  },
  {
    name: "GROW",
    items: [
      "Advanced analytics",
      "Content optimization",
      "Campaign support",
      "Business automation",
    ],
  },
];

export function Tiers() {
  return (
    <Section
      title="Start small. Grow when you need to."
      sub="You don't need a giant social-media operation on day one. Start with the essentials, then add more as your business grows."
    >
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal key={t.name} delay={Math.min(i * 0.08, 0.3)}>
            <article className="nx-card nx-card--soft h-full p-7">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[color:var(--nx-blue-soft)]">
                {t.name}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {t.items.map((item) => (
                  <li key={item} className="text-sm text-slate-300">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const SERVICES = [
  {
    title: "Social Media Setup",
    body: "One-time setup service to connect your accounts, brand information and content system.",
  },
  {
    title: "Brand Content Package",
    body: "Create a consistent visual and messaging identity for your social channels.",
  },
  {
    title: "Custom Automation",
    body: "Connect NexusPly to your existing business tools and workflows.",
  },
  {
    title: "Done-for-You Management",
    body: "For businesses that want NexusPly to handle their social-media operation with minimal involvement from their team.",
  },
];

export function Services() {
  return (
    <Section title="Need more help?" tone="glow">
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {SERVICES.map((s, i) => (
          <Tile key={s.title} title={s.title} body={s.body} index={i} />
        ))}
      </div>

      <Reveal className="mt-12 text-center">
        <Tap>
          <a
            href="mailto:hello@nexusply.ai"
            className="inline-block rounded-[10px] border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            Talk to NexusPly
          </a>
        </Tap>
      </Reveal>
    </Section>
  );
}

const AUDIENCES = [
  { title: "Local businesses", body: "Stay visible to your community." },
  { title: "Restaurants", body: "Promote menus, offers and experiences." },
  {
    title: "Professional services",
    body: "Build credibility and generate inquiries.",
  },
  {
    title: "E-commerce brands",
    body: "Show products and stay in front of customers.",
  },
  {
    title: "Consultants & coaches",
    body: "Turn expertise into consistent content.",
  },
  {
    title: "Startups",
    body: "Build awareness without building a large marketing team.",
  },
  {
    title: "Creators",
    body: "Spend more time creating and less time managing distribution.",
  },
  {
    title: "Agencies",
    body: "Manage more client accounts without adding repetitive manual work.",
  },
];

export function Audiences() {
  return (
    <Section title="Made for businesses that don't have time for social media.">
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((a, i) => (
          <Tile key={a.title} title={a.title} body={a.body} index={i} />
        ))}
      </div>
    </Section>
  );
}
