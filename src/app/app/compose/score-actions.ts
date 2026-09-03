"use server";

import { requireWorkspace } from "@/lib/workspace";
import {
  scoreContent,
  suggestHashtagsFor,
  type ScoreResult,
  type HashtagResult,
} from "@/lib/scoring";

/**
 * Compose's entry point into scoring — session-authenticated.
 *
 * The work itself lives in `@/lib/scoring` because the browser extension calls
 * the same two operations over a bearer token (`src/app/api/ext/v1`). These
 * wrappers exist only to turn a session into an orgId.
 */

export type { ScoreResult, HashtagResult, ScoreFactor } from "@/lib/scoring";

export async function scorePost(content: string): Promise<ScoreResult> {
  const { workspace, session } = await requireWorkspace();
  return scoreContent(workspace.id, content, session.user.id);
}

export async function suggestHashtags(content: string): Promise<HashtagResult> {
  const { workspace, session } = await requireWorkspace();
  return suggestHashtagsFor(workspace.id, content, session.user.id);
}
