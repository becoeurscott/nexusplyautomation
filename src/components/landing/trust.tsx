import { Reveal } from "./reveal";
import { Section, Tile } from "./section";

/**
 * Credibility for a product that has no customers yet.
 *
 * The obvious move here is what competitors do — "Trusted by 15,000+
 * businesses", a star rating, a wall of testimonials. We have none of those,
 * and inventing them would be fabricating credibility, so this section does
 * the honest version instead: say plainly that NexusPly is new, and make
 * promises we can actually keep. Every claim below is verifiable in the
 * product today.
 *
 * When real proof exists, add it via `social-proof.tsx` — those components
 * render nothing until they're given real data.
 */
const GUARANTEES = [
  {
    title: "Nothing publishes without you",
    body: "Every post waits for your approval before it goes anywhere. You review it first, always.",
  },
  {
    title: "Cancel any time",
    body: "No contracts and no lock-in. Stop whenever you want and you're not billed again.",
  },
  {
    title: "Your content stays yours",
    body: "Your posts, your accounts, your audience. Leave and take all of it with you.",
  },
  {
    title: "Your accounts stay secure",
    body: "Connection credentials are encrypted, and we never see or store your social passwords.",
  },
  {
    title: "A real person answers",
    body: "Email us and you reach the team building this — not a ticket queue.",
  },
  {
    title: "One clear price",
    body: "The monthly price is the price. No setup fees and no per-post charges.",
  },
];

export function Trust() {
  return (
    <Section
      id="trust"
      title="We're new. Here's why that's a good thing."
      sub="NexusPly is early, and we'd rather say so than pretend otherwise. Being early means you get direct access to the people building it, and your feedback genuinely shapes what ships next."
      tone="glow"
    >
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUARANTEES.map((g, i) => (
          <Tile key={g.title} title={g.title} body={g.body} index={i} />
        ))}
      </div>

      <Reveal className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-slate-400">
          Questions before you start?{" "}
          <a
            href="mailto:hello@nexusply.ai"
            className="font-medium text-[color:var(--nx-blue-soft)] underline transition hover:text-white"
          >
            Email us
          </a>{" "}
          and you&apos;ll hear back from the team directly.
        </p>
      </Reveal>
    </Section>
  );
}
