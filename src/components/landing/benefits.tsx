import Image from "next/image";
import { Reveal } from "./reveal";

const BENEFITS = [
  {
    title: "Reclaim 20+ Hours Weekly",
    body: "Stop pasting between five tools. Plan, generate, and schedule everything from one place.",
    img: "/img/nexus/benefit-1.png",
    w: 812,
    h: 190,
  },
  {
    title: "Never Miss a Comment",
    body: "Every comment and mention from every platform lands in one inbox, ready to answer.",
    img: "/img/nexus/benefit-2.png",
    w: 784,
    h: 190,
  },
  {
    title: "Scale Without Extra Headcount",
    body: "Automations answer FAQs, queue follow-ups, and keep posting while you teach or sell.",
    img: "/img/nexus/benefit-3.png",
    w: 815,
    h: 108,
  },
  {
    title: "Pay in Your Own Currency",
    body: "KES, NGN, XOF, or USD — with M-Pesa, MTN MoMo, Orange Money, or any bank card.",
    img: "/img/nexus/benefit-4.png",
    w: 919,
    h: 142,
  },
];

export function Benefits() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Put Your Content Engine on Fast-Forward
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Stop letting manual posting slow down your growth. Nexusply works in the
            background so your team can focus on what matters.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={0.2 * (i % 2)}>
              <article className="nx-card nx-card--soft h-full p-7">
                <div className="mb-6 flex h-24 items-center overflow-hidden">
                  <Image
                    src={b.img}
                    alt=""
                    width={b.w}
                    height={b.h}
                    className="h-auto max-h-24 w-auto max-w-full"
                  />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{b.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
