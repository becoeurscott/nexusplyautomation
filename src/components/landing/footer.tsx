import Link from "next/link";
import { Logo } from "./brand";

const COLUMNS = [
  {
    title: "Services",
    links: [
      { l: "Features", h: "#features" },
      { l: "How it works", h: "#how-it-works" },
      { l: "Pricing", h: "#pricing" },
      { l: "Testimonials", h: "#testimonials" },
      { l: "FAQ", h: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { l: "About", h: "#" },
      { l: "Blog", h: "#" },
      { l: "Change Log", h: "#" },
      { l: "Contact", h: "mailto:hello@nexusply.ai" },
    ],
  },
  {
    title: "Legal",
    links: [
      { l: "Privacy Policy", h: "#" },
      { l: "Terms & Conditions", h: "#" },
      { l: "DPA", h: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[color:var(--nx-bg)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Nexusply is an intelligent social-media automation platform designed to
              connect your tools, eliminate digital clutter, and streamline daily
              publishing — priced for Africa.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.l}>
                    <Link href={l.h} className="text-slate-400 transition hover:text-white">
                      {l.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Nexusply AI Automation. All rights reserved.</span>
          <span>Built on Zernio · Higgsfield · CloneViral</span>
        </div>
      </div>
    </footer>
  );
}
