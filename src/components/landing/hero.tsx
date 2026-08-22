import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";

/**
 * Template structure: centered hero on dark base with navy radial glow,
 * star-rating badge with avatar strip, headline with italic gradient accent,
 * single primary CTA, then the full-width product shot in an edge-lit frame.
 */
export function Hero() {
  return (
    <section className="nx-glow-top-strong relative overflow-hidden pt-36 pb-16">
      <div className="absolute inset-0 nx-grid" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4">
            <Image
              src="/img/nexus/avatars-strip.png"
              alt="Trusted teams"
              width={81}
              height={17}
              className="h-[17px] w-auto"
            />
            <span className="flex items-center gap-1 text-xs font-medium text-slate-200">
              <Stars />
              5.0 · Trusted by African teams
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h1 className="font-display mx-auto mt-7 max-w-3xl text-6xl font-bold leading-[1.05] text-white sm:text-7xl lg:text-8xl">
            Nexusply{" "}
            <span className="bg-gradient-to-r from-[#73b4ff] via-[#0a63f4] to-[#73b4ff] bg-clip-text italic text-transparent">
              Automation
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.35}>
          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold text-slate-200">
            Run your entire social presence on autopilot with intelligent AI.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Plan, generate, publish, listen, and learn — across every platform. Built for
            African schools, creators, and SMBs. Paid via M-Pesa, MTN MoMo, Orange, or card.
          </p>
        </Reveal>

        <Reveal delay={0.6}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Tap>
              <Link
                href="/sign-up"
                className="rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
              >
                Get Started Free
              </Link>
            </Tap>
            <Tap>
              <a
                href="#pricing"
                className="rounded-[10px] border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                See pricing
              </a>
            </Tap>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            30 free credits monthly · No credit card · Cancel any time
          </p>
        </Reveal>
      </div>

      {/* Product shot in edge-lit frame — template's FwQE0VSK hero image */}
      <Reveal delay={0.8} className="relative mx-auto mt-16 max-w-6xl px-6">
        <div className="nx-card overflow-hidden !rounded-[18px] p-1.5">
          <Image
            src="/img/nexus/hero-dashboard.png"
            alt="Nexusply dashboard"
            width={1536}
            height={1024}
            priority
            className="w-full rounded-[12px]"
          />
        </div>
        {/* under-glow */}
        <div
          className="absolute inset-x-16 -bottom-8 h-24 rounded-full bg-[color:var(--nx-blue)]/25 blur-[60px]"
          aria-hidden
        />
      </Reveal>
    </section>
  );
}

function Stars() {
  return (
    <span className="flex text-[#f5c518]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6z" />
        </svg>
      ))}
    </span>
  );
}
