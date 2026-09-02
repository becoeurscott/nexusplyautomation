import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trendSnapshots, trendWatchlists } from "@/db/schema";
import { zernioForOrg } from "@/lib/zernio/for-workspace";
import { num, rows, str } from "@/app/app/_lib/normalize";

/**
 * Watchlists and the periodic snapshot that fills them.
 *
 * ── WHAT THIS DOES AND DOESN'T DO ────────────────────────────────────────────
 *
 * A snapshot currently summarises **the org's own published posts** — which of
 * them performed best, and which hashtags appear in the ones that did. It is
 * not public trend data and it is not competitor data.
 *
 * That limit is a data-source fact, not a shortcut: the publishing API this app
 * runs on reports only on accounts the customer has already connected. It has
 * no trend-discovery endpoint and no way to read a handle you don't own, so
 * `trend_watchlists.competitor_handles` cannot be populated from it at all.
 * Filling `competitorPosts` needs either a paid social-listening provider or
 * the browser extension pushing snapshots of pages the user visits — see the
 * plan's Phase D. Until one of those exists, the UI must say plainly that it is
 * showing the customer's own posts, and the pricing copy must not promise
 * competitor tracking.
 */

export type TopPost = {
  id: string;
  content: string;
  /** Always set — an unpublished post has no results to rank. */
  publishedAt: string;
  score: number;
};

export type TopHashtag = { tag: string; count: number };

export type WatchlistRow = {
  id: string;
  platform: string;
  niche: string | null;
  keywords: string[];
  competitorHandles: string[];
  enabled: boolean;
  createdAt: Date;
};

export async function listWatchlists(orgId: string): Promise<WatchlistRow[]> {
  return db
    .select({
      id: trendWatchlists.id,
      platform: trendWatchlists.platform,
      niche: trendWatchlists.niche,
      keywords: trendWatchlists.keywords,
      competitorHandles: trendWatchlists.competitorHandles,
      enabled: trendWatchlists.enabled,
      createdAt: trendWatchlists.createdAt,
    })
    .from(trendWatchlists)
    .where(eq(trendWatchlists.orgId, orgId))
    .orderBy(desc(trendWatchlists.createdAt));
}

export type SnapshotRow = {
  id: string;
  watchlistId: string;
  capturedAt: Date;
  topPosts: TopPost[];
  topHashtags: TopHashtag[];
};

/** Most recent snapshot for each of an org's watchlists, newest first. */
export async function latestSnapshot(
  orgId: string,
  watchlistId: string,
): Promise<SnapshotRow | null> {
  const [row] = await db
    .select({
      id: trendSnapshots.id,
      watchlistId: trendSnapshots.watchlistId,
      capturedAt: trendSnapshots.capturedAt,
      topPosts: trendSnapshots.topPosts,
      topHashtags: trendSnapshots.topHashtags,
    })
    .from(trendSnapshots)
    .innerJoin(trendWatchlists, eq(trendWatchlists.id, trendSnapshots.watchlistId))
    .where(
      and(
        eq(trendSnapshots.watchlistId, watchlistId),
        eq(trendWatchlists.orgId, orgId),
      ),
    )
    .orderBy(desc(trendSnapshots.capturedAt))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    topPosts: Array.isArray(row.topPosts) ? (row.topPosts as TopPost[]) : [],
    topHashtags: Array.isArray(row.topHashtags)
      ? (row.topHashtags as TopHashtag[])
      : [],
  };
}

const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

/**
 * Builds one snapshot for a watchlist from the org's own published posts.
 *
 * Returns null when there's nothing worth recording (no publishing connection,
 * or no published posts yet) so the caller can skip the write rather than
 * storing an empty row that looks like a failed capture.
 */
export type Summary = { topPosts: TopPost[]; topHashtags: TopHashtag[] };

/**
 * The pure half of a capture: a posts payload in, a ranked summary out.
 *
 * Separated from the fetch so it can be tested against real-world payload
 * shapes without a live account — see `scripts/check-trends.ts`. Returns null
 * when there is nothing publishable to rank, which the caller treats as "skip"
 * rather than writing an empty snapshot that would look like a failed capture.
 */
export function summarisePosts(raw: unknown): Summary | null {
  const posts = rows(raw, "posts")
    .map((r) => {
      const id = str(r, "id", "_id", "postId");
      const publishedAt = str(r, "publishedAt", "published_at");
      if (!id || !publishedAt) return null; // unpublished posts have no results yet
      const content = str(r, "content", "text", "caption", "body") ?? "";
      // Engagement is reported under different names per platform; whichever is
      // present stands in for "how well did this do". Weights rise with effort:
      // a share costs more than a like, so it says more.
      const score =
        (num(r, "impressions", "views", "videoViews", "reach") ?? 0) +
        (num(r, "likes", "reactions", "favourites") ?? 0) * 10 +
        (num(r, "comments", "commentCount", "replies") ?? 0) * 20 +
        (num(r, "shares", "reposts", "retweets") ?? 0) * 30;
      return { id, content, publishedAt, score };
    })
    .filter((p): p is TopPost => p !== null);

  if (posts.length === 0) return null;

  const topPosts = [...posts].sort((a, b) => b.score - a.score).slice(0, 10);

  // Hashtags counted across the strongest posts only — a tag that appears in
  // everything, including the posts that flopped, isn't telling you anything.
  const counts = new Map<string, number>();
  for (const p of topPosts) {
    // Lowercase BEFORE the per-post Set, not after: "#School" and "#school" in
    // the same caption are one tag used once, and deduping the raw matches
    // would count them as two — inflating the number the customer is shown.
    const inThisPost = new Set(
      (p.content.match(HASHTAG_RE) ?? []).map((t) => t.toLowerCase()),
    );
    for (const tag of inThisPost) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const topHashtags: TopHashtag[] = [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return { topPosts, topHashtags };
}

export async function captureSnapshot(orgId: string): Promise<Summary | null> {
  const client = await zernioForOrg(orgId);
  if (!client) return null;

  const raw = await client.posts.list({ limit: 100 }).catch(() => null);
  if (!raw) return null;

  return summarisePosts(raw);
}

/** Captures and stores a snapshot. Returns false when there was nothing to store. */
export async function writeSnapshot(
  orgId: string,
  watchlistId: string,
): Promise<boolean> {
  const captured = await captureSnapshot(orgId);
  if (!captured) return false;

  await db.insert(trendSnapshots).values({
    watchlistId,
    topPosts: captured.topPosts,
    topHashtags: captured.topHashtags,
    // Deliberately left empty: nothing in the current stack can populate these.
    topSounds: [],
    competitorPosts: [],
  });
  return true;
}
