/**
 * Post status in words people use, with colour doing the same job as the text.
 *
 * The raw values are API states like "queued" or "processing", which were
 * being printed verbatim in uppercase. Unrecognised states fall back to a
 * tidied version of the original rather than a wrong guess.
 */
const STATUSES: Record<string, { label: string; className: string }> = {
  published: { label: "Posted", className: "bg-emerald-50 text-emerald-700" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700" },
  queued: { label: "Waiting to go out", className: "bg-blue-50 text-blue-700" },
  pending: { label: "Waiting to go out", className: "bg-blue-50 text-blue-700" },
  processing: { label: "Sending now", className: "bg-amber-50 text-amber-700" },
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  failed: { label: "Didn't send", className: "bg-red-50 text-red-700" },
  error: { label: "Didn't send", className: "bg-red-50 text-red-700" },
};

export function StatusPill({ status }: { status?: string | null }) {
  const known = status ? STATUSES[status.toLowerCase()] : undefined;
  const label = known?.label ?? tidy(status);
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-xs font-medium " +
        (known?.className ?? "bg-slate-100 text-slate-600")
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
