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
        "nx-glass nx-sheen rounded-2xl p-5 " + className
      }
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-[color:var(--nx-blue-soft)]">
                {icon}
              </span>
            )}
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          </div>
          {href && linkLabel && (
            <Link
              href={href}
              className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-[color:var(--nx-blue-soft)] hover:text-white"
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
    <p className="nx-glass-soft rounded-xl p-4 text-sm text-slate-400">{children}</p>
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
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--nx-blue-soft)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold leading-none text-white">{value}</div>
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
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-xs font-bold text-[color:var(--nx-blue-soft)]">
      {initials || "?"}
    </span>
  );
}

export function Bar({ pct, tone = "blue" }: { pct: number; tone?: "blue" | "amber" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/12">
      <div
        className={
          "h-full rounded-full " +
          (tone === "amber" ? "bg-amber-400" : "bg-[color:var(--nx-blue-soft)]")
        }
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
