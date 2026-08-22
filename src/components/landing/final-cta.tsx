import Link from "next/link";
import { Reveal } from "./reveal";

/** Template's closing CTA on the blue-green grain gradient (cta-gradient.png). */
export function FinalCTA() {
  return (
    <section className="relative px-6 pb-24">
      <Reveal className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-[25px] px-8 py-20 text-center sm:px-16"
          style={{
            backgroundImage: "url(/img/nexus/cta-gradient.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/25" aria-hidden />
          <div className="relative">
            <h2 className="font-display mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Put Your Social Presence on Autopilot?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Join forward-thinking African teams saving hours today. Start free with 30
              credits — no credit card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-[10px] bg-white px-7 py-3.5 text-sm font-bold text-[#021d46] transition hover:bg-slate-100"
              >
                Get Started Free
              </Link>
              <a
                href="#pricing"
                className="rounded-[10px] border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Compare plans
              </a>
            </div>
            <p className="mt-6 text-xs font-medium text-white/70">
              🔥 30 free credits every month — forever. No credit card required.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
