import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { socialConnections } from "@/db/schema";
import { decrypt, encrypt } from "@/lib/encryption";
import type { OAuthProvider, TokenSet } from "./providers/types";

/** Same fallback order used by auth.ts and layout.tsx — no separate env var for this. */
export function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ];
  const found = candidates.find(
    (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
  );
  return found ?? "http://localhost:3000";
}

/**
 * Signed, short-lived `state` param — the CSRF protection an OAuth
 * authorize request needs and that better-auth's internal implementation
 * doesn't expose for a hand-built flow (see the plan's note on this).
 *
 * Payload is plain (base64url JSON) plus an HMAC tag — not encrypted, since
 * orgId isn't a secret; the tag is what stops a caller from forging or
 * replaying a modified state past its expiry.
 */
type StatePayload = { orgId: string; platform: string; nonce: string; exp: number };

function stateSecret(): Buffer {
  const raw = process.env.BETTER_AUTH_SECRET;
  if (!raw) throw new Error("BETTER_AUTH_SECRET is not set");
  return Buffer.from(raw, "utf8");
}

const STATE_TTL_SECONDS = 10 * 60;

export function signState(orgId: string, platform: string): string {
  const payload: StatePayload = {
    orgId,
    platform,
    nonce: randomBytes(9).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const tag = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${tag}`;
}

/** Returns the payload if the state is untampered and unexpired, else null. */
export function verifyState(state: string): StatePayload | null {
  const [body, tag] = state.split(".");
  if (!body || !tag) return null;

  const expectedTag = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  const a = Buffer.from(tag);
  const b = Buffer.from(expectedTag);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Persists a freshly-exchanged token set, encrypting both secrets
 * independently (see the schema comment on why one {ciphertext,iv,tag}
 * triple can't cover two secrets). Upserts on (orgId, platform,
 * providerAccountId) so reconnecting the same account updates its row.
 */
export async function saveConnection(opts: {
  orgId: string;
  connectedById: string;
  platform: "tiktok";
  tokens: TokenSet;
}): Promise<void> {
  const access = encrypt(opts.tokens.accessToken);
  const refresh = opts.tokens.refreshToken ? encrypt(opts.tokens.refreshToken) : null;
  const expiresAt = new Date(Date.now() + opts.tokens.expiresInSeconds * 1000);

  const values = {
    orgId: opts.orgId,
    platform: opts.platform,
    providerAccountId: opts.tokens.providerAccountId,
    displayName: opts.tokens.displayName,
    accessTokenCiphertext: access.ciphertext,
    accessTokenIv: access.iv,
    accessTokenTag: access.tag,
    refreshTokenCiphertext: refresh?.ciphertext ?? null,
    refreshTokenIv: refresh?.iv ?? null,
    refreshTokenTag: refresh?.tag ?? null,
    scope: opts.tokens.scope,
    status: "active" as const,
    expiresAt,
    connectedById: opts.connectedById,
    updatedAt: new Date(),
  };

  await db
    .insert(socialConnections)
    .values(values)
    .onConflictDoUpdate({
      target: [
        socialConnections.orgId,
        socialConnections.platform,
        socialConnections.providerAccountId,
      ],
      set: values,
    });
}

export type Connection = {
  id: string;
  platform: string;
  providerAccountId: string;
  displayName: string | null;
  status: "active" | "expired" | "revoked" | "error";
  expiresAt: Date | null;
  scope: string | null;
  createdAt: Date;
};

export async function listConnections(orgId: string): Promise<Connection[]> {
  const rows = await db
    .select({
      id: socialConnections.id,
      platform: socialConnections.platform,
      providerAccountId: socialConnections.providerAccountId,
      displayName: socialConnections.displayName,
      status: socialConnections.status,
      expiresAt: socialConnections.expiresAt,
      scope: socialConnections.scope,
      createdAt: socialConnections.createdAt,
    })
    .from(socialConnections)
    .where(eq(socialConnections.orgId, orgId))
    .orderBy(desc(socialConnections.createdAt));
  return rows;
}

/** Decrypted access token for one connection — for making an authenticated call. */
export async function getAccessToken(connectionId: string): Promise<string | null> {
  const [row] = await db
    .select({
      accessTokenCiphertext: socialConnections.accessTokenCiphertext,
      accessTokenIv: socialConnections.accessTokenIv,
      accessTokenTag: socialConnections.accessTokenTag,
    })
    .from(socialConnections)
    .where(eq(socialConnections.id, connectionId))
    .limit(1);
  if (!row) return null;
  return decrypt({
    ciphertext: row.accessTokenCiphertext,
    iv: row.accessTokenIv,
    tag: row.accessTokenTag,
  });
}

/**
 * Refreshes one connection if it's within `bufferSeconds` of expiring.
 * Used both by the on-demand path and the cron sweep in
 * `src/lib/inngest/functions/oauth-refresh.ts`, so the "should we refresh,
 * and what happens on failure" logic exists in exactly one place.
 */
export async function refreshConnectionIfNeeded(
  provider: OAuthProvider,
  connectionId: string,
  bufferSeconds = 60 * 60,
): Promise<"refreshed" | "skipped" | "no-refresh-token" | "failed"> {
  const [row] = await db
    .select({
      orgId: socialConnections.orgId,
      expiresAt: socialConnections.expiresAt,
      refreshTokenCiphertext: socialConnections.refreshTokenCiphertext,
      refreshTokenIv: socialConnections.refreshTokenIv,
      refreshTokenTag: socialConnections.refreshTokenTag,
      connectedById: socialConnections.connectedById,
    })
    .from(socialConnections)
    .where(eq(socialConnections.id, connectionId))
    .limit(1);
  if (!row) return "skipped";

  const dueAt = row.expiresAt ? row.expiresAt.getTime() - bufferSeconds * 1000 : 0;
  if (Date.now() < dueAt) return "skipped";

  if (!row.refreshTokenCiphertext || !row.refreshTokenIv || !row.refreshTokenTag) {
    await db
      .update(socialConnections)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(socialConnections.id, connectionId));
    return "no-refresh-token";
  }

  const refreshToken = decrypt({
    ciphertext: row.refreshTokenCiphertext,
    iv: row.refreshTokenIv,
    tag: row.refreshTokenTag,
  });

  try {
    const tokens = await provider.refresh(refreshToken);
    await saveConnection({
      orgId: row.orgId,
      connectedById: row.connectedById,
      platform: provider.platform,
      tokens,
    });
    return "refreshed";
  } catch (e) {
    // A refresh that fails almost always means the grant was revoked on the
    // platform's side — surface that instead of letting the next publish
    // attempt fail with a confusing, unrelated error.
    console.error(`[oauth] refresh failed for connection ${connectionId}`, e);
    await db
      .update(socialConnections)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(socialConnections.id, connectionId));
    return "failed";
  }
}

/**
 * Active connections whose access token expires within `bufferSeconds`, or
 * that never had an expiry recorded at all (defensive — treat unknown as due).
 * Used by the cron sweep; `refreshConnectionIfNeeded` re-checks expiry per
 * row before actually refreshing, so this only needs to narrow the sweep,
 * not be the sole source of truth.
 */
export async function findConnectionsDueForRefresh(
  bufferSeconds: number,
): Promise<{ id: string; platform: "tiktok" }[]> {
  const dueAt = new Date(Date.now() + bufferSeconds * 1000);
  return db
    .select({ id: socialConnections.id, platform: socialConnections.platform })
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.status, "active"),
        or(lte(socialConnections.expiresAt, dueAt), isNull(socialConnections.expiresAt)),
      ),
    );
}
