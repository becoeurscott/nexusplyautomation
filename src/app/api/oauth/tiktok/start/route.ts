import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/workspace";
import { signState, siteUrl } from "@/lib/oauth/connections";
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
  return NextResponse.redirect(tiktokProvider.authorizeUrl(state));
}
