/**
 * The shape every social-platform OAuth provider implements.
 *
 * Only `tiktok.ts` exists today. This interface exists so a second platform
 * is an additional file, not a rewrite — the same reasoning as the provider
 * interface in `src/lib/media/index.ts`. Do not add stub implementations for
 * platforms that aren't built yet; Instagram, YouTube and LinkedIn have no
 * code here until they're actually being wired up (see the plan's note on
 * why LinkedIn in particular is out of scope for now — a 3–4 month API
 * approval gate, not a coding task).
 */

export type TokenSet = {
  accessToken: string;
  /** Not every grant issues one. */
  refreshToken: string | null;
  /** Seconds from now until the access token expires. */
  expiresInSeconds: number;
  /** The platform's own id for the connected account — not our uuid. */
  providerAccountId: string;
  /** Human-readable handle/name, if the provider will hand one back cheaply. */
  displayName: string | null;
  /** Space-separated granted scopes, as reported by the provider. */
  scope: string;
};

export interface OAuthProvider {
  readonly platform: "tiktok";
  /** True when this provider's client id/secret are configured. */
  isConfigured(): boolean;
  /**
   * Builds the URL to send the user to for consent. `codeChallenge` is
   * PKCE (RFC 7636) — TikTok's live authorize endpoint rejects this app's
   * requests without one (`errCode 10007, error_type code_challenge`),
   * confirmed against the real API rather than assumed from docs, which
   * describe PKCE as mobile/desktop-only. Required here regardless.
   */
  authorizeUrl(state: string, codeChallenge: string): string;
  /**
   * Exchanges an authorization code (from the callback) for tokens.
   * `codeVerifier` is the PKCE secret that produced the challenge passed to
   * `authorizeUrl` for this same attempt — the token endpoint recomputes the
   * challenge from it and rejects a mismatch.
   */
  exchangeCode(code: string, codeVerifier: string): Promise<TokenSet>;
  /** Uses a stored refresh token to mint a new access token. */
  refresh(refreshToken: string): Promise<TokenSet>;
}
