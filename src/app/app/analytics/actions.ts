"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { trendWatchlists } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { inngest } from "@/lib/inngest/client";
import { friendlyError } from "@/lib/user-message";

export type WatchlistActionState = { ok: false; message: string } | null;

/**
 * Watchlist management.
 *
 * Every action re-derives the org from the session and scopes its query by it —
 * a watchlist id arriving in a form field proves nothing about who owns it.
 */

export async function createWatchlist(
  _prev: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const { workspace } = await requireWorkspace();

  const platform = String(formData.get("platform") ?? "").trim();
  const niche = String(formData.get("niche") ?? "").trim();
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 25);

  if (!platform) {
    return { ok: false, message: "Pick a platform first." };
  }

  try {
    await db.insert(trendWatchlists).values({
      orgId: workspace.id,
      platform,
      niche: niche || null,
      keywords,
      competitorHandles: [],
    });
  } catch (e) {
    return { ok: false, message: friendlyError(e, "watchlist.create") };
  }

  revalidatePath("/app/analytics");
  return null;
}

export async function deleteWatchlist(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("watchlistId") ?? "");
  if (!id) return;

  await db
    .delete(trendWatchlists)
    .where(and(eq(trendWatchlists.id, id), eq(trendWatchlists.orgId, workspace.id)));

  revalidatePath("/app/analytics");
}

/**
 * Asks for a fresh capture now instead of waiting for the nightly sweep.
 *
 * Free: capturing costs nothing (`trend.snapshot` is seeded at 0 credits), so
 * this deliberately doesn't go through `withCredits`. It's a read of the
 * customer's own posts, not a generation.
 */
export async function refreshWatchlist(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("watchlistId") ?? "");
  if (!id) return;

  const [owned] = await db
    .select({ id: trendWatchlists.id })
    .from(trendWatchlists)
    .where(and(eq(trendWatchlists.id, id), eq(trendWatchlists.orgId, workspace.id)))
    .limit(1);
  if (!owned) return;

  await inngest.send({
    name: "trend.snapshot.requested",
    data: { orgId: workspace.id, watchlistId: id },
  });

  revalidatePath("/app/analytics");
}
