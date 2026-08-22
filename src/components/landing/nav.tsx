import Link from "next/link";
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
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[#020817]/70 px-5 backdrop-blur-[5px]">
        <Logo />
        <nav className="hidden gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {l.label}
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
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(10,99,244,0.8)] transition hover:bg-[color:var(--nx-blue-hover)]"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
