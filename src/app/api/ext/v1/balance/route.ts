import { getBalance } from "@/lib/credits";
import { authed, json, preflight } from "../_lib";

/** GET -> remaining creation credits, so the overlay can warn before spending. */
export async function GET(req: Request) {
  const auth = await authed(req);
  if ("response" in auth) return auth.response;

  return json(req, { balance: await getBalance(auth.orgId) });
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
