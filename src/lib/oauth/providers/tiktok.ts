import { siteUrl } from "../connections";
import type { OAuthProvider, TokenSet } from "./types";

/**
 * TikTok OAuth v2 — endpoints and field names verified against TikTok's own
 * docs (Aug 2026): authorize URL and its query params from the Login Kit for
 * Web guide, token exchange/refresh shape from the OAuth token management
 * guide. Nothing here is guessed.
 *
 * Scope: `video.publish` is what TikTok's Content Posting API requires;
 * `user.info.basic` is added so the callback can show a real handle instead
 * of a bare id. Until this app passes TikTok's audit, posts made through it
 * are restricted to self-only visibility, capped at 5 users per 24h — that's
 * a platform-side limit, not a bug in this code (see the plan for sources).
 */

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const SCOPE = "user.info.basic,video.publish";

function redirectUri(): string {
  return `${siteUrl()}/api/oauth/tiktok/callback`;
}

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function fetchDisplayName(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${USER_INFO_URL}?fields=display_name`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { user?: { display_name?: string } } };
    return data.data?.user?.display_name ?? null;
  } catch {
    // Non-fatal — the connection still works with the provider account id
    // standing in for a display name.
    return null;
  }
}

async function tokenRequest(body: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams(body),
  });

  const data = (await res.json()) as TikTokTokenResponse;
  if (!res.ok || !data.access_token || !data.open_id) {
    throw new Error(
      `TikTok token request failed: ${data.error ?? res.status} ${data.error_description ?? ""}`,
    );
  }

  const displayName = await fetchDisplayName(data.access_token);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresInSeconds: data.expires_in ?? 0,
    providerAccountId: data.open_id,
    displayName,
    scope: data.scope ?? SCOPE,
  };
}

export const tiktokProvider: OAuthProvider = {
  platform: "tiktok",

  isConfigured(): boolean {
    return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
  },

  authorizeUrl(state: string, codeChallenge: string): string {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY is not set");

    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: "code",
      scope: SCOPE,
      redirect_uri: redirectUri(),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      throw new Error("TikTok OAuth is not configured");
    }
    return tokenRequest({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    });
  },

  async refresh(refreshToken: string): Promise<TokenSet> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      throw new Error("TikTok OAuth is not configured");
    }
    return tokenRequest({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  },
};
