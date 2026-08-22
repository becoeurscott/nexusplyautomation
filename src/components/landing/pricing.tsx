"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PLANS, formatUsd } from "@/lib/i18n/pricing";
import { Check } from "lucide-react";

/** Template treatment: dark section, edge-lit cards, featured card in blue. USD only. */
export function Pricing() {
  return (
    <section id="pricing" className="nx-glow-top relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Transparent Pricing That Pays for Itself
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Every plan includes monthly credits. Credits pay for posts, AI generations,
            and videos. Top up any time.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
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
                  Popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>

              <div className="mt-6">
                <div className="font-display text-4xl font-bold text-white">
                  {formatUsd(plan.priceUsd)}
                  {plan.priceUsd > 0 && (
                    <span className="ml-1 text-base font-medium text-slate-400">/mo</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {plan.credits.toLocaleString()} credits included
                </div>
              </div>

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
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Top-up packs always available · M-Pesa, MTN MoMo, Orange Money, and cards · Cancel any time
        </p>
      </div>
    </section>
  );
}
