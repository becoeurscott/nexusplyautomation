import { inngest } from "../client";
import { db } from "@/db";
import { trendWatchlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { writeSnapshot } from "@/lib/trends";

/**
 * Daily capture of what's working in each org's own posts.
 *
 * Modelled on `creditPlanRefill`: one `step.run` to find the work, then one per
 * item so a single failing org doesn't lose the whole sweep and Inngest can
 * retry just that one.
 *
 * Costs nothing — `trend.snapshot` is seeded at 0 credits and this is
 * system-triggered, so it deliberately does NOT go through `withCredits`. The
 * customer didn't ask for this run and shouldn't pay for it; they pay only when
 * they open a detailed report (`trend.detail_view`).
 */
export const trendSnapshotDaily = inngest.createFunction(
  {
    id: "trend-snapshot-daily",
    retries: 2,
    triggers: [{ cron: "TZ=Etc/UTC 20 1 * * *" }], // 01:20 UTC, after the credit sweep
  },
  async ({ step }) => {
    const watchlists = await step.run("find-enabled-watchlists", async () =>
      db
        .select({ id: trendWatchlists.id, orgId: trendWatchlists.orgId })
        .from(trendWatchlists)
        .where(eq(trendWatchlists.enabled, true)),
    );

    let captured = 0;
    for (const w of watchlists) {
      const ok = await step.run(`snapshot-${w.id}`, () =>
        writeSnapshot(w.orgId, w.id),
      );
      if (ok) captured++;
    }

    // `skipped` is orgs with no publishing connection or nothing published yet
    // — an expected state for a new workspace, not a failure.
    return { watchlists: watchlists.length, captured, skipped: watchlists.length - captured };
  },
);

/**
 * One-off capture, triggered when someone presses "Refresh" on a watchlist.
 *
 * The event name was documented in `src/lib/inngest/client.ts` long before this
 * existed; this is that contract finally being honoured.
 */
export const trendSnapshotOnDemand = inngest.createFunction(
  {
    id: "trend-snapshot-ondemand",
    retries: 2,
    triggers: [{ event: "trend.snapshot.requested" }],
  },
  async ({ event }) => {
    const { orgId, watchlistId } = event.data as {
      orgId?: string;
      watchlistId?: string;
    };
    if (!orgId || !watchlistId) {
      return { skipped: true, reason: "missing orgId or watchlistId" };
    }

    // Ownership is re-checked here rather than trusted from the event payload.
    // An event is just data: matching the watchlist id ALONE would let a
    // payload naming someone else's watchlist capture into it, so the org has
    // to match too.
    const [watchlist] = await db
      .select({ id: trendWatchlists.id })
      .from(trendWatchlists)
      .where(and(eq(trendWatchlists.id, watchlistId), eq(trendWatchlists.orgId, orgId)))
      .limit(1);
    if (!watchlist) return { skipped: true, reason: "watchlist not found for this org" };

    const ok = await writeSnapshot(orgId, watchlistId);
    return ok ? { captured: true } : { skipped: true, reason: "nothing to capture" };
  },
);
