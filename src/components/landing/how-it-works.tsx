import { Reveal } from "./reveal";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Link your social accounts via Zernio's OAuth. We never see your platform passwords.",
  },
  {
    n: "02",
    title: "Plan",
    body: "Set your brand context, then let AI draft a month of posts you can edit into shape.",
  },
  {
    n: "03",
    title: "Publish",
    body: "Cross-post now or queue for later. Auto-retries on failure, credits refund if a post never lands.",
  },
  {
    n: "04",
    title: "Measure",
    body: "Real analytics, best time to post, and campaign roll-ups by tracking tag.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            From Zero to Running in an Afternoon
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.2 * i} as="li">
              <div className="nx-card nx-card--soft h-full p-6">
                <span className="font-display bg-gradient-to-br from-[#73b4ff] to-[#0a63f4] bg-clip-text text-4xl font-bold text-transparent">
                  {s.n}
                </span>
                <h3 className="font-display mt-4 text-xl font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
