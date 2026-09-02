/**
 * Post status in words people use, with colour doing the same job as the text.
 *
 * The raw values are API states like "queued" or "processing", which were
 * being printed verbatim in uppercase. Unrecognised states fall back to a
 * tidied version of the original rather than a wrong guess.
 */
const STATUSES: Record<string, { label: string; className: string }> = {
  published: { label: "Posted", className: "bg-emerald-500/15 text-emerald-300" },
  scheduled: { label: "Scheduled", className: "bg-[color:var(--nx-blue)]/20 text-[color:var(--nx-blue-soft)]" },
  queued: { label: "Waiting to go out", className: "bg-[color:var(--nx-blue)]/20 text-[color:var(--nx-blue-soft)]" },
  pending: { label: "Waiting to go out", className: "bg-[color:var(--nx-blue)]/20 text-[color:var(--nx-blue-soft)]" },
  processing: { label: "Sending now", className: "bg-amber-400/15 text-amber-300" },
  draft: { label: "Draft", className: "bg-white/10 text-slate-300" },
  failed: { label: "Didn't send", className: "bg-red-500/15 text-red-300" },
  error: { label: "Didn't send", className: "bg-red-500/15 text-red-300" },
};

export function StatusPill({ status }: { status?: string | null }) {
  const known = status ? STATUSES[status.toLowerCase()] : undefined;
  const label = known?.label ?? tidy(status);
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-xs font-medium " +
        (known?.className ?? "bg-white/10 text-slate-300")
      }
    >
      {label}
    </span>
  );
}

function tidy(status?: string | null): string {
  if (!status) return "Unknown";
  const s = status.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
