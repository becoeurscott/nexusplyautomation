import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { assertMember, requireSession } from "@/lib/workspace";
import { saveConnection, siteUrl, verifyState } from "@/lib/oauth/connections";
import { tiktokProvider } from "@/lib/oauth/providers/tiktok";

/**
 * TikTok redirects here after the user approves (or denies) access.
 *
 * Every failure path redirects to /app/accounts with a specific `error`
 * code rather than throwing — this is a browser navigation landing on a
 * page a real person is looking at, not an API a client can retry.
 */
export async function GET(req: NextRequest) {
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, siteUrl()));

  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    // The user denied consent, or TikTok itself rejected the request.
    return redirectTo(`/app/accounts?error=tiktok_${error}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectTo("/app/accounts?error=tiktok_missing_params");
  }

  const payload = verifyState(state);
  if (!payload || payload.platform !== "tiktok") {
    // Tampered, expired, or replayed state — reject rather than trust it.
    return redirectTo("/app/accounts?error=tiktok_invalid_state");
  }

  // The session cookie proves who's currently signed in; state proves which
  // org started this flow. Both must agree — a signed-in user can only
  // complete a connect flow they themselves started for their own org.
  const session = await requireSession();
  try {
    await assertMember(payload.orgId, session.user.id);
  } catch {
    return redirectTo("/app/accounts?error=tiktok_org_mismatch");
  }

  try {
    const tokens = await tiktokProvider.exchangeCode(code);
    await saveConnection({
      orgId: payload.orgId,
      connectedById: session.user.id,
      platform: "tiktok",
      tokens,
    });

    await db.insert(auditEvents).values({
      orgId: payload.orgId,
      actorUserId: session.user.id,
      action: "account.connected",
      entityType: "social_connection",
      payload: { platform: "tiktok", providerAccountId: tokens.providerAccountId },
      result: "ok",
    });

    return redirectTo("/app/accounts?connected=tiktok");
  } catch (e) {
    console.error("[oauth] tiktok callback failed", e);
    await db.insert(auditEvents).values({
      orgId: payload.orgId,
      actorUserId: session.user.id,
      action: "account.connected",
      entityType: "social_connection",
      payload: { platform: "tiktok" },
      result: "error",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return redirectTo("/app/accounts?error=tiktok_exchange_failed");
  }
}
