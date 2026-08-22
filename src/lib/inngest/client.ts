import { Inngest } from "inngest";

/**
 * Inngest client. Event names are typed loosely at v1; when the surface
 * stabilises we upgrade to `staticSchema<Events>()` for compile-time payloads.
 * Every event we send should still follow the naming convention below.
 *
 * Naming: `<domain>.<action>[.<qualifier>]`
 *   post.scheduled            — a post has been created with a future runAt
 *   post.failed               — a scheduled post failed after all retries
 *   credit.plan_refill.requested — manual refill (usually from admin)
 *   trend.snapshot.requested  — one-off pull for a watchlist
 *   automation.tick.requested — evaluate a single automation now
 */
export const inngest = new Inngest({ id: "nexusply" });
