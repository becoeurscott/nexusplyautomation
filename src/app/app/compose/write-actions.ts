"use server";

import { requireWorkspace } from "@/lib/workspace";
import {
  generateCaption,
  generateCarousel,
  generateIdeas,
  generateLongForm,
  rewriteCaption,
  type ListResult,
  type TextResult,
} from "@/lib/writing";

/**
 * Compose's entry point into the writing tools — session-authenticated.
 *
 * Thin on purpose: the work lives in `@/lib/writing` so the extension can call
 * the same functions over a bearer token without a second copy of the prompts.
 */

export type { TextResult, ListResult } from "@/lib/writing";

export async function writeIdeas(brief: string): Promise<ListResult> {
  const { workspace, session } = await requireWorkspace();
  return generateIdeas(workspace.id, brief, session.user.id);
}

export async function writeCaption(brief: string): Promise<TextResult> {
  const { workspace, session } = await requireWorkspace();
  return generateCaption(workspace.id, brief, session.user.id);
}

export async function writeRewrite(
  text: string,
  direction: string,
): Promise<TextResult> {
  const { workspace, session } = await requireWorkspace();
  return rewriteCaption(workspace.id, text, direction, session.user.id);
}

export async function writeLongForm(brief: string): Promise<TextResult> {
  const { workspace, session } = await requireWorkspace();
  return generateLongForm(workspace.id, brief, session.user.id);
}

export async function writeCarousel(brief: string): Promise<ListResult> {
  const { workspace, session } = await requireWorkspace();
  return generateCarousel(workspace.id, brief, session.user.id);
}
