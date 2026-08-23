import Link from "next/link";
import { Logo } from "./brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { l: "Features", h: "#features" },
      { l: "Pricing", h: "#pricing" },
      { l: "Integrations", h: "#platforms" },
      { l: "Automation", h: "#features" },
      { l: "Analytics", h: "#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { l: "Guides", h: "#how-it-works" },
      { l: "Social Media Tips", h: "#how-it-works" },
      { l: "Business Growth", h: "#why" },
      { l: "Help Center", h: "mailto:hello@nexusply.ai" },
    ],
  },
  {
    title: "Company",
    links: [
      { l: "About", h: "#why" },
      { l: "Contact", h: "mailto:hello@nexusply.ai" },
      { l: "Privacy", h: "#" },
      { l: "Terms", h: "#" },
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
              Social media management for businesses that want to stay visible without
              staying online all day.
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
                    <Link
                      href={l.h}
                      className="text-slate-400 transition hover:text-white"
                    >
                      {l.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>NexusPly © {new Date().getFullYear()}</span>
          <span>Create. Schedule. Publish. Engage. Measure. Automate.</span>
        </div>
      </div>
    </footer>
  );
}
