import { suggestHashtagsFor } from "@/lib/scoring";
import { authed, json, preflight, readContent } from "../_lib";

/** POST { content } -> suggested hashtags and keywords. Costs 1 credit. */
export async function POST(req: Request) {
  const auth = await authed(req);
  if ("response" in auth) return auth.response;

  const content = await readContent(req);
  if (content === null) {
    return json(req, { error: "Send a JSON body with a `content` string." }, 400);
  }

  return json(req, await suggestHashtagsFor(auth.orgId, content));
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
