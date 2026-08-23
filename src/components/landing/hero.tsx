import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";
import { Accent } from "./section";
import { Rating } from "./social-proof";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="nx-glow-top-strong relative overflow-hidden pt-36 pb-16">
      <div className="absolute inset-0 nx-grid" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200">
              Content · Publishing · Engagement · Growth
            </span>
            {/* Renders only once there is a real, sourced rating. */}
            <Rating />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h1 className="font-display mx-auto mt-7 max-w-3xl text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Still posting <Accent>manually</Accent>?
          </h1>
          <p className="font-display mx-auto mt-4 text-2xl font-semibold text-slate-100 sm:text-3xl">
            Your social media, handled.
          </p>
        </Reveal>

        <Reveal delay={0.35}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            NexusPly helps businesses stay consistently active across social media
            without spending hours planning posts, creating content, writing captions,
            scheduling publications and managing conversations.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="font-display mx-auto mt-6 max-w-xl text-xl font-semibold text-slate-100">
            You focus on your business.
            <br />
            We handle your social media.
          </p>
        </Reveal>

        <Reveal delay={0.6}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Tap>
              <Link
                href="/sign-up"
                className="rounded-[10px] bg-[color:var(--nx-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,99,244,0.9)] transition hover:bg-[color:var(--nx-blue-hover)]"
              >
                Start Your Free Trial
              </Link>
            </Tap>
            <Tap>
              <a
                href="#how-it-works"
                className="rounded-[10px] border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                See How NexusPly Works
              </a>
            </Tap>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            14-day trial · No card required · Cancel any time
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            No complicated setup. No social media expertise required.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.8} className="relative mx-auto mt-16 max-w-6xl px-6">
        {/* Rendered from markup, not a screenshot — see dashboard-preview.tsx.
            The stock template image here showed a product that doesn't exist. */}
        <div className="nx-card overflow-hidden !rounded-[18px] p-1.5">
          <DashboardPreview />
        </div>
        <div
          className="absolute inset-x-16 -bottom-8 h-24 rounded-full bg-[color:var(--nx-blue)]/25 blur-[60px]"
          aria-hidden
        />
      </Reveal>
    </section>
  );
}
