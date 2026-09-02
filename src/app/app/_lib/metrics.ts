import { compact, metricsOf, num } from "./normalize";

/**
 * Turning a provider's analytics blob into labelled numbers a person can read.
 *
 * Extracted from the dashboard so the Results page shows the same figures under
 * the same names — two copies of this list would eventually disagree about what
 * "Views" means, and the customer would be the one to notice.
 *
 * Each spec lists every key a provider might use for the same idea, because the
 * shape varies by platform and by endpoint; the first one present wins.
 */
export const METRICS: { keys: string[]; label: string }[] = [
  { keys: ["impressions", "views", "videoViews", "reach"], label: "Views" },
  { keys: ["likes", "reactions", "favourites"], label: "Likes" },
  { keys: ["comments", "commentCount", "replies"], label: "Comments" },
  { keys: ["shares", "reposts", "retweets"], label: "Shares" },
  { keys: ["followers", "followerCount", "newFollowers"], label: "Followers" },
  { keys: ["engagementRate", "engagement"], label: "Engagement" },
];

export type ReadMetric = { label: string; value: string };

export function readMetrics(raw: unknown): ReadMetric[] {
  const m = metricsOf(raw);
  if (!m) return [];
  const out: ReadMetric[] = [];
  for (const spec of METRICS) {
    const v = num(m, ...spec.keys);
    if (v === null) continue;
    // Engagement arrives either as a fraction (0.041) or already as a
    // percentage (4.1) depending on the platform — both must render as "4.1%".
    const isRate = spec.label === "Engagement";
    out.push({
      label: spec.label,
      value: isRate ? `${v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1)}%` : compact(v),
    });
  }
  return out;
}
