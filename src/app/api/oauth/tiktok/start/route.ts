import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/workspace";
import {
  PKCE_COOKIE_NAME,
  codeChallengeFromVerifier,
  generateCodeVerifier,
  signState,
  siteUrl,
} from "@/lib/oauth/connections";
import { tiktokProvider } from "@/lib/oauth/providers/tiktok";

/**
 * Sends the signed-in user to TikTok's own consent screen. Requires a
 * session (redirects to sign-in otherwise, via requireOrg) so the callback
 * always has a real org and user to attach the connection to.
 */
export async function GET() {
  const { org } = await requireOrg();

  if (!tiktokProvider.isConfigured()) {
    return NextResponse.redirect(new URL("/app/accounts?error=tiktok_not_configured", siteUrl()));
  }

  const state = signState(org.id, "tiktok");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);

  const res = NextResponse.redirect(tiktokProvider.authorizeUrl(state, codeChallenge));
  // httpOnly so the verifier never touches page JS or a referrer header —
  // it only needs to survive the round trip to TikTok and back.
  res.cookies.set(PKCE_COOKIE_NAME, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/oauth/tiktok",
  });
  return res;
}
