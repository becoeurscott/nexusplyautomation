import Link from "next/link";

/** Card chrome shared by every dashboard panel. */
export function Card({
  title,
  icon,
  href,
  linkLabel,
  children,
  className = "",
}: {
  title?: string;
  icon?: React.ReactNode;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] " +
        className
      }
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-[color:var(--nx-blue)]">
                {icon}
              </span>
            )}
            <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          </div>
          {href && linkLabel && (
            <Link
              href={href}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-[color:var(--nx-blue)] hover:text-[color:var(--nx-blue)]"
            >
              {linkLabel}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{children}</p>
  );
}

/** Round progress dial — used for the credit allowance. */
export function Dial({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto grid h-28 w-28 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--nx-blue)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold leading-none text-slate-800">{value}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
          credits
        </div>
      </div>
    </div>
  );
}

/** Initials bubble, so accounts and people read at a glance. */
export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
      {initials || "?"}
    </span>
  );
}

export function Bar({ pct, tone = "blue" }: { pct: number; tone?: "blue" | "amber" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={
          "h-full rounded-full " +
          (tone === "amber" ? "bg-amber-400" : "bg-[color:var(--nx-blue)]")
        }
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
