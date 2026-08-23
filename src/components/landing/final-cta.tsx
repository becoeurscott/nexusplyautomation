import Link from "next/link";
import { Reveal } from "./reveal";
import { Tap } from "@/components/tap";

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
              You run the business.
            </h2>
            <p className="font-display mx-auto mt-3 max-w-2xl text-2xl font-semibold text-white/90 sm:text-3xl">
              We&apos;ll help handle the social media.
            </p>

            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="rounded-[14px] border border-white/20 bg-black/20 p-5 text-left">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
                  Stop asking
                </div>
                <p className="mt-2 text-lg font-semibold text-white">
                  “What should I post today?”
                </p>
              </div>
              <div className="rounded-[14px] border border-white/20 bg-black/20 p-5 text-left">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
                  Start knowing
                </div>
                <p className="mt-2 text-lg font-semibold text-white">
                  “My content is already planned.”
                </p>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-xl text-white/80">
              Stop manually posting everywhere. Start managing your social presence from
              one system. Stop spending hours on repetitive tasks. Start spending that
              time on your business.
            </p>

            <p className="font-display mt-10 text-2xl font-bold text-white">
              Your social media, handled.
            </p>

            <div className="mt-7">
              <Tap>
                <Link
                  href="/sign-up"
                  className="inline-block rounded-[10px] bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#021d46] transition hover:bg-white/90"
                >
                  Start Your Free Trial
                </Link>
              </Tap>
            </div>

            <p className="mt-6 text-xs italic text-white/70">
              Create. Schedule. Publish. Engage. Measure. Automate.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
