import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";

/**
 * Personal access tokens for the browser extension.
 *
 * These are hashed with SHA-256, NOT encrypted with `src/lib/encryption.ts`.
 * That file's AES-GCM is reversible because the product has to decrypt those
 * secrets and send them upstream. A token is only ever *compared*, so storing
 * something we could decrypt would be strictly worse: a database leak would
 * hand over working credentials instead of useless digests.
 *
 * Tokens are shown to the customer exactly once, at creation. There is no way
 * to recover one afterwards, by design — "show me my token again" and "let an
 * attacker read my token" are the same database query.
 *
 * The extension needs this because it runs on tiktok.com / youtube.com origins
 * and cannot read the app's httpOnly session cookie. That's a browser security
 * boundary, not a limitation worth engineering around.
 */

const PREFIX = "nxp_";

export type NewToken = { id: string; token: string };

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createApiToken(
  orgId: string,
  name: string,
): Promise<NewToken> {
  // 32 bytes of randomness; base64url so it survives a copy-paste out of a
  // terminal or an email without escaping.
  const token = PREFIX + randomBytes(32).toString("base64url");
  const [row] = await db
    .insert(apiTokens)
    .values({
      orgId,
      name: name.trim() || "Browser extension",
      tokenHash: hash(token),
      scopes: ["score", "hashtags", "balance"],
    })
    .returning({ id: apiTokens.id });

  return { id: row.id, token };
}

export type TokenRow = {
  id: string;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export async function listApiTokens(orgId: string): Promise<TokenRow[]> {
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(and(eq(apiTokens.orgId, orgId), isNull(apiTokens.revokedAt)))
    .orderBy(desc(apiTokens.createdAt));
}

/** Soft-revoke: the row stays so `lastUsedAt` remains auditable after the fact. */
export async function revokeApiToken(orgId: string, tokenId: string): Promise<void> {
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.orgId, orgId)));
}

/**
 * Resolves a bearer token to an org, or null.
 *
 * Null covers every failure — malformed, unknown, revoked, expired — on
 * purpose. Telling a caller *which* of those it was is free reconnaissance for
 * anyone probing tokens.
 */
export async function orgIdForToken(token: string | null): Promise<string | null> {
  if (!token || !token.startsWith(PREFIX)) return null;

  const digest = hash(token);
  const [row] = await db
    .select({
      id: apiTokens.id,
      orgId: apiTokens.orgId,
      tokenHash: apiTokens.tokenHash,
      revokedAt: apiTokens.revokedAt,
      expiresAt: apiTokens.expiresAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, digest))
    .limit(1);

  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return null;

  // The lookup already matched on the hash, so this comparison is belt-and-
  // braces rather than the real gate — but it's constant-time, which the index
  // lookup is not, and it costs nothing.
  const a = Buffer.from(row.tokenHash, "hex");
  const b = Buffer.from(digest, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Fire-and-forget: a failed usage stamp must never fail the request itself.
  void db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, row.id))
    .catch(() => {});

  return row.orgId;
}

/** Pulls the bearer token out of an Authorization header. */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
