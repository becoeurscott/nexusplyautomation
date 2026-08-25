"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PLANS, formatUsd } from "@/lib/i18n/pricing";
import { BUNDLES } from "@/lib/credits/activities";

/**
 * Credits are shown as "creation credits" and always alongside what they buy —
 * a credit count on its own is a token meter, which is what this product is
 * trying not to feel like. The internal $0.01 rate is never surfaced.
 */
export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="nx-glow-top relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple pricing. Powerful automation.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Your plan covers the platform. Creation credits cover what you make
            with it. Every plan starts with a 14-day free trial.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 p-1">
            {(
              [
                ["Monthly", false],
                ["Annual · 2 months free", true],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => setAnnual(value)}
                aria-pressed={annual === value}
                className={
                  "rounded-full px-4 py-2 text-sm font-medium transition " +
                  (annual === value
                    ? "bg-[color:var(--nx-blue)] text-white"
                    : "text-slate-300 hover:text-white")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = annual ? plan.priceUsdAnnual : plan.priceUsd;
            return (
              <article
                key={plan.code}
                className={
                  "relative flex flex-col rounded-[25px] p-7 " +
                  (plan.featured
                    ? "border border-[color:var(--nx-blue)]/60 bg-gradient-to-b from-[#0a2a66] to-[#071a3d] shadow-[0_30px_80px_-30px_rgba(10,99,244,0.6)]"
                    : "nx-card nx-card--soft")
                }
              >
                {plan.featured && (
                  <span className="absolute -top-3 right-6 rounded-full bg-[color:var(--nx-blue)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[color:var(--nx-blue-soft)]">
                  {plan.name}
                </h3>

                <div className="mt-4">
                  <span className="font-display text-4xl font-bold text-white">
                    {formatUsd(price)}
                  </span>
                  <span className="ml-1 text-base font-medium text-slate-400">
                    {annual ? "/year" : "/month"}
                  </span>
                </div>

                <div className="mt-2 text-sm font-semibold text-white">
                  {plan.credits.toLocaleString()} creation credits a month
                </div>

                <p className="mt-3 text-sm text-slate-400">{plan.tagline}</p>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--nx-blue-soft)]" />
                      <span className="text-slate-300">{h}</span>
                    </li>
                  ))}
                </ul>

                <motion.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }}>
                  <Link
                    href="/sign-up"
                    className={
                      "mt-8 inline-flex w-full justify-center rounded-[10px] px-5 py-2.5 text-sm font-semibold transition " +
                      (plan.featured
                        ? "bg-[color:var(--nx-blue)] text-white hover:bg-[color:var(--nx-blue-hover)]"
                        : "border border-white/15 text-white hover:bg-white/5")
                    }
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </article>
            );
          })}
        </div>

        {/* Credits mean nothing as a number; this is what they buy. */}
        <div className="mt-14">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            What your credits create
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {BUNDLES.map((b) => (
              <div key={b.key} className="nx-card nx-card--soft p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {b.label}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold text-[color:var(--nx-blue-soft)]">
                    {b.credits} credits
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
                  {b.includes.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--nx-blue-soft)]" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-400">
            14-day free trial on every plan · No card required to start · Cancel any
            time
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Pay securely by card · Cancel any time
          </p>
        </div>
      </div>
    </section>
  );
}
