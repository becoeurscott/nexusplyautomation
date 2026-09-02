import Link from "next/link";
import { BarChart3, Clock, TrendingUp } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { NotReadyYet } from "../_components/not-ready";
import { Card, EmptyNote, Bar } from "../_components/dashboard-ui";
import { StatusPill } from "../_components/status-pill";
import { StaggerGroup } from "@/components/motion-stagger";
import { readMetrics } from "../_lib/metrics";
import { formatDateTime, num, rows, str, toPosts } from "../_lib/normalize";

/**
 * Results — what actually happened after publishing.
 *
 * Every panel fetches independently and catches on its own, the same way the
 * dashboard does: one endpoint being unavailable greys out a single card
 * rather than blanking the page. Numbers come from the same `readMetrics`
 * helper the dashboard uses, so the two screens can't quote different figures.
 */
export default async function AnalyticsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);

  if (!client) {
    return <NotReadyYet title="Results" what="results" />;
  }

  const [overviewRaw, accountsRaw, postsRaw] = await Promise.all([
    client.analytics.overview().catch(() => null),
    client.accounts.list().catch(() => null),
    client.posts.list({ limit: 50 }).catch(() => null),
  ]);

  const metrics = readMetrics(overviewRaw);
  const accounts = rows(accountsRaw, "accounts").map((r) => ({
    id: str(r, "id", "_id") ?? "",
    name: str(r, "name", "username", "handle") ?? "Account",
  }));

  // Best-time-to-post is per-account, so it needs one to ask about. The first
  // connected account is the sensible default; a picker can come later once we
  // know anyone actually wants to compare accounts side by side.
  const primary = accounts[0];
  const bestTimeRaw = primary
    ? await client.analytics.bestTimeToPost({ accountId: primary.id }).catch(() => null)
    : null;
  const slots = readBestTimes(bestTimeRaw);

  const published = toPosts(postsRaw)
    .filter((p) => p.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 12);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Results</h1>
      <p className="mt-2 text-slate-400">
        How your posts are doing, and when your audience is actually paying attention.
      </p>

      <StaggerGroup className="mt-8 grid gap-4 md:grid-cols-12">
        <Card
          title="Overall"
          icon={<BarChart3 className="h-4 w-4" />}
          className="md:col-span-12 lg:col-span-7"
        >
          {metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-lg font-bold text-white">{m.value}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>
              No numbers yet. Once your posts have been live for a little while,
              they&apos;ll show up here.
            </EmptyNote>
          )}
        </Card>

        <Card
          title="Best time to post"
          icon={<Clock className="h-4 w-4" />}
          className="md:col-span-12 lg:col-span-5"
        >
          {slots.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-slate-400">
                Based on when {primary?.name ?? "your account"} usually gets the most
                attention.
              </p>
              <ul className="space-y-2.5">
                {slots.map((s) => (
                  <li key={s.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{s.label}</span>
                      <span className="font-mono text-slate-400">{s.pct}%</span>
                    </div>
                    <div className="mt-1">
                      <Bar pct={s.pct} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyNote>
              We need a few more published posts before we can spot a pattern in when
              your audience shows up.
            </EmptyNote>
          )}
        </Card>

        <Card
          title="Recent posts"
          icon={<TrendingUp className="h-4 w-4" />}
          href="/app/posts"
          linkLabel="All posts"
          className="md:col-span-12"
        >
          {published.length > 0 ? (
            <ul className="divide-y divide-white/5">
              {published.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-slate-200">
                      {p.content || "(no text)"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(p.publishedAt)}
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>
              Nothing published yet.{" "}
              <Link href="/app/compose" className="underline hover:text-white">
                Create your first post
              </Link>
              .
            </EmptyNote>
          )}
        </Card>
      </StaggerGroup>
    </div>
  );
}

/**
 * Best-time-to-post comes back in a few different shapes depending on the
 * platform, so this reads defensively and returns nothing rather than guessing
 * when it doesn't recognise the payload. Scores are normalised to a percentage
 * of the strongest slot, since the raw numbers are only meaningful relative to
 * each other.
 */
function readBestTimes(raw: unknown): { label: string; pct: number }[] {
  const list = rows(raw, "bestTimes", "slots", "times", "data");
  if (list.length === 0) return [];

  const parsed = list
    .map((r) => {
      const day = str(r, "day", "weekday", "dayOfWeek");
      const hour = num(r, "hour", "hourOfDay");
      const score = num(r, "score", "engagement", "value", "weight") ?? 0;
      if (day === null && hour === null) return null;
      const label = [day, hour !== null ? `${String(hour).padStart(2, "0")}:00` : null]
        .filter(Boolean)
        .join(" · ");
      return label ? { label, score } : null;
    })
    .filter((x): x is { label: string; score: number } => x !== null);

  if (parsed.length === 0) return [];

  const top = Math.max(...parsed.map((p) => p.score));
  return parsed
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p) => ({
      label: p.label,
      pct: top > 0 ? Math.round((p.score / top) * 100) : 0,
    }));
}
