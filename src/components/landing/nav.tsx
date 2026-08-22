"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./brand";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

/** Template treatment: floating dark nav, backdrop-blur(5px), hairline border. */
export function Nav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
            break;
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-5 backdrop-blur-[5px]">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-2 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <span className="relative z-10">{l.label}</span>
              {active === l.href && (
                <motion.span
                  layoutId="landing-nav-underline"
                  className="absolute inset-x-2 -bottom-0.5 h-[2px] rounded-full bg-[color:var(--nx-blue)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:inline"
          >
            Log in
          </Link>
          <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.12 }}>
            <Link
              href="/sign-up"
              className="inline-block rounded-[10px] bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(10,99,244,0.8)] transition hover:bg-[color:var(--nx-blue-hover)]"
            >
              Sign up
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
