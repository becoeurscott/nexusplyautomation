import Image from "next/image";
import { Reveal } from "./reveal";

/** Template's "Plugs Seamlessly into the Tools You Already Use" logo strips. */
const STRIPS = [
  { img: "/img/nexus/integrations-1.png", w: 1600, h: 408 },
  { img: "/img/nexus/integrations-2.png", w: 980, h: 277 },
  { img: "/img/nexus/integrations-3.png", w: 2345, h: 600 },
  { img: "/img/nexus/integrations-4.png", w: 800, h: 271 },
];

export function Integrations() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Plugs Into the Platforms You Already Use
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Zernio connects your accounts, Higgsfield renders your media, CloneViral cuts
            your clips — Nexusply conducts the orchestra.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="nx-marquee-mask mt-14 space-y-6 overflow-hidden">
            <div className="flex w-max items-center gap-6 nx-scroll-x">
              {[...STRIPS, ...STRIPS].map((s, i) => (
                <Image
                  key={i}
                  src={s.img}
                  alt=""
                  width={s.w}
                  height={s.h}
                  className="h-14 w-auto opacity-80"
                />
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="mt-10 text-center text-xs uppercase tracking-widest text-slate-500">
            Powered by Zernio · Higgsfield · CloneViral · Claude · Gemini · Flutterwave
          </p>
        </Reveal>
      </div>
    </section>
  );
}
