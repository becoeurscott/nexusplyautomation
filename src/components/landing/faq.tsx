"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QS = [
  {
    q: "Is NexusPly an AI tool?",
    a: "NexusPly is a social-media management and automation service. The technology behind the platform is there to make the work faster and easier; customers don't need to manage the underlying tools.",
  },
  {
    q: "Do I have to create my own content?",
    a: "NexusPly can help with content creation, planning and publishing so you don't have to start from a blank page every day.",
  },
  {
    q: "Can I approve posts before they are published?",
    a: "Yes. Your workflow can include review and approval before publication.",
  },
  {
    q: "Can I manage multiple social networks?",
    a: "Yes. NexusPly is designed around multi-platform social-media management.",
  },
  {
    q: "Can NexusPly automatically publish content?",
    a: "Yes. Scheduled and automated publishing is a core part of the service.",
  },
  {
    q: "Can it help with comments and messages?",
    a: "Engagement management can be included depending on the platform and plan.",
  },
  {
    q: "Can I connect my existing social accounts?",
    a: "Yes. NexusPly is designed to work with your existing business social accounts.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Plans can be canceled according to the subscription terms.",
  },
  {
    q: "Do I need marketing experience?",
    a: "No. NexusPly is designed to simplify social-media management for business owners.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Everything you need to know before you start.
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
