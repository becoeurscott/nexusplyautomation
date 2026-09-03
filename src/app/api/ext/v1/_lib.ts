import { NextResponse } from "next/server";
import { bearerFrom, orgIdForToken } from "@/lib/api-tokens";

/**
 * Shared plumbing for the extension's REST surface.
 *
 * This is deliberately NOT tRPC. `createContext()` reads a session cookie, and
 * the extension has none — it runs on tiktok.com / youtube.com origins. Bolting
 * a bearer-token branch into that context function would put two very different
 * trust models in one security-sensitive place. A small versioned REST surface
 * also stays stable for an installed extension that updates on its own
 * schedule, independent of internal router refactors.
 */

/**
 * CORS for `chrome-extension://` (and `moz-extension://`) origins.
 *
 * The extension id isn't known until the store assigns one, and it differs
 * between a local unpacked build and the published one, so the origin is echoed
 * back after a scheme check rather than matched against a fixed list. That is
 * safe here *only* because every route requires a bearer token: there is no
 * cookie or ambient credential for a hostile page to ride on, so allowing the
 * origin grants nothing on its own. `credentials` is never enabled.
 */
function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && /^(chrome-extension|moz-extension):\/\//.test(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export function json(
  req: Request,
  body: unknown,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

/**
 * Authenticates a request, returning the org id or a ready-to-return 401.
 *
 * The error body is identical for every failure mode (missing, malformed,
 * unknown, revoked, expired) so probing tokens reveals nothing.
 */
export async function authed(
  req: Request,
): Promise<{ orgId: string } | { response: NextResponse }> {
  const orgId = await orgIdForToken(bearerFrom(req.headers.get("authorization")));
  if (!orgId) {
    return {
      response: json(req, { error: "Invalid or missing token." }, 401),
    };
  }
  return { orgId };
}

/** Reads `content` from a JSON body, tolerating a malformed one. */
export async function readContent(req: Request): Promise<string | null> {
  try {
    const body = (await req.json()) as { content?: unknown };
    return typeof body?.content === "string" ? body.content : null;
  } catch {
    return null;
  }
}
