import Image from "next/image";
import { Reveal } from "./reveal";

/**
 * Template's "Everything You Need … in One Hub": alternating two-column rows,
 * each with a big edge-lit neon visual (the template's real feature images).
 */
const FEATURES = [
  {
    title: "Compose Once, Publish Everywhere",
    body: "Write one post and cross-publish to TikTok, Instagram, Facebook, LinkedIn, X, and YouTube in a single shot. Recurring queue slots keep your calendar full without daily effort.",
    img: "/img/nexus/feature-builder.png",
    w: 1254,
    h: 1008,
  },
  {
    title: "Real-Time Analytics",
    body: "Track follower growth, best time to post, and per-post timelines in one unified view. Roll campaigns up by tracking tag and see what actually converts.",
    img: "/img/nexus/feature-analytics.png",
    w: 1254,
    h: 1254,
  },
  {
    title: "AI Media Studio",
    body: "Generate images, videos, and voiceovers in your brand's voice. Turn one long video into a week of vertical shorts — dubbed into another language if you need it.",
    img: "/img/nexus/feature-api.png",
    w: 1254,
    h: 1254,
  },
  {
    title: "Team Access Control",
    body: "Owners, admins, members, and viewers with full audit logs. Your API keys stay encrypted; every action is traced to who clicked it.",
    img: "/img/nexus/feature-access.png",
    w: 1254,
    h: 1254,
  },
];

export function Features() {
  return (
    <section id="features" className="nx-glow-top relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Everything You Need to Grow in One Hub
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Powerful publishing, AI, and analytics engineered for speed, accuracy, and
            ultimate flexibility.
          </p>
        </Reveal>

        <div className="mt-16 space-y-8">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title}>
              <article
                className={
                  "nx-card grid items-center gap-8 overflow-hidden p-8 lg:grid-cols-2 lg:p-12 " +
                  (i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : "")
                }
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                    {f.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                    {f.body}
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={f.img}
                    alt={f.title}
                    width={f.w}
                    height={f.h}
                    className="w-full transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
