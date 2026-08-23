/**
 * Defensive readers for upstream payloads.
 *
 * The dashboard pulls from several endpoints at once and renders whatever came
 * back. Shapes vary (sometimes an array, sometimes `{ data: [...] }`) and any
 * one of them can fail independently, so nothing here throws — a section with
 * no usable data simply doesn't render.
 */

export function rows(raw: unknown): Record<string, unknown>[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] } | null)?.data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list.filter(
    (r): r is Record<string, unknown> => typeof r === "object" && r !== null,
  );
}

export function str(rec: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export function num(rec: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

/** Pulls a flat metrics object out of whatever the analytics endpoint returned. */
export function metricsOf(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const rec = raw as Record<string, unknown>;
  for (const key of ["data", "summary", "totals", "overview"]) {
    const nested = rec[key];
    if (typeof nested === "object" && nested !== null && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return rec;
}

export type SimplePost = {
  id: string;
  status: string;
  content: string;
  scheduledAt: string | null;
  publishedAt: string | null;
};

export function toPost(rec: Record<string, unknown>): SimplePost | null {
  const id = str(rec, "id", "postId");
  if (!id) return null;
  return {
    id,
    status: str(rec, "status", "state") ?? "unknown",
    content: str(rec, "content", "text", "caption", "body") ?? "",
    scheduledAt: str(rec, "scheduledAt", "scheduled_at", "scheduledFor"),
    publishedAt: str(rec, "publishedAt", "published_at"),
  };
}

export function toPosts(raw: unknown): SimplePost[] {
  return rows(raw)
    .map(toPost)
    .filter((p): p is SimplePost => p !== null);
}

/** Sorts by a date field, soonest first, tolerating missing/invalid dates. */
export function bySoonest(a: string | null, b: string | null): number {
  const ta = a ? new Date(a).getTime() : NaN;
  const tb = b ? new Date(b).getTime() : NaN;
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return ta - tb;
}

export function formatDateTime(raw?: string | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
