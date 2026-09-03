import { scoreContent } from "@/lib/scoring";
import { authed, json, preflight, readContent } from "../_lib";

/** POST { content } -> a score for that draft. Costs 1 credit, same as in-app. */
export async function POST(req: Request) {
  const auth = await authed(req);
  if ("response" in auth) return auth.response;

  const content = await readContent(req);
  if (content === null) {
    return json(req, { error: "Send a JSON body with a `content` string." }, 400);
  }

  const result = await scoreContent(auth.orgId, content);
  // A refused score (too short, no credits, unreadable reply) is a legitimate
  // answer, not a server fault — 200 with ok:false, so the extension can show
  // the message instead of guessing from a status code.
  return json(req, result);
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
