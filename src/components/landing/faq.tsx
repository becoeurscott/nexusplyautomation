"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QS = [
  {
    q: "Is Starter really free forever?",
    a: "Yes. 30 credits every month, 3 connected accounts, and every core feature. No credit card, ever. If you outgrow it, upgrade in one click.",
  },
  {
    q: "How exactly do credits work?",
    a: "Every action has a small credit cost: 1 credit per scheduled post, 3 for an AI caption, 20 for a generated video. Your plan tops up monthly; top-up packs are always available. Failed posts refund automatically.",
  },
  {
    q: "How does Nexusply connect to my social accounts?",
    a: "You link each account once from Settings. Credentials are encrypted at rest — only the last four characters of any key are ever shown back to you, and we never see your platform passwords.",
  },
  {
    q: "What happens if a post fails to publish?",
    a: "We retry the publish up to five times with backoff. If it never lands, the credit is automatically refunded to your balance and the failure is logged for support visibility.",
  },
  {
    q: "Can I change or cancel my plan at any time?",
    a: "Any time, directly from your billing page. Your organisation drops to the free tier and keeps its data. Hard-delete on request within 30 days.",
  },
  {
    q: "Do you support M-Pesa STK Push?",
    a: "Yes — via IntaSend on the School / Institute / Agency tiers. Cards, MTN MoMo, and Orange Money are also live via Flutterwave and Paystack.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Got Questions? We've Got Answers.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Everything you need to know about credits, security, and payments.
          </p>
        </div>
        <ul className="mt-12 space-y-3">
          {QS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
