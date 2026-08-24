import { inngest } from "../client";
import {
  findConnectionsDueForRefresh,
  refreshConnectionIfNeeded,
} from "@/lib/oauth/connections";
import { tiktokProvider } from "@/lib/oauth/providers/tiktok";

/**
 * Keeps social connections' access tokens fresh before they expire.
 *
 * TikTok's access tokens last ~24h against a refresh token valid ~365 days,
 * so this runs every few hours rather than daily like creditPlanRefill —
 * a daily sweep could miss the window entirely for a token minted right
 * after the previous run.
 *
 * Only one provider exists today; the loop below is written to add a
 * provider by extending the map, not by duplicating the function.
 */
const PROVIDERS = { tiktok: tiktokProvider } as const;

export const socialConnectionRefresh = inngest.createFunction(
  {
    id: "social-connection-refresh",
    retries: 3,
    triggers: [{ cron: "TZ=Etc/UTC 15 */6 * * *" }], // every 6 hours, offset from other jobs
  },
  async ({ step }) => {
    // Refresh 90 minutes before expiry — comfortably inside the 6-hour sweep
    // interval, so nothing active can expire between two runs.
    const BUFFER_SECONDS = 90 * 60;

    const due = await step.run("find-due-connections", () =>
      findConnectionsDueForRefresh(BUFFER_SECONDS),
    );

    const results = { refreshed: 0, skipped: 0, failed: 0, "no-refresh-token": 0 };

    for (const conn of due) {
      const outcome = await step.run(`refresh-${conn.id}`, () =>
        refreshConnectionIfNeeded(PROVIDERS[conn.platform], conn.id, BUFFER_SECONDS),
      );
      results[outcome] = (results[outcome] ?? 0) + 1;
    }

    return { checked: due.length, ...results };
  },
);
