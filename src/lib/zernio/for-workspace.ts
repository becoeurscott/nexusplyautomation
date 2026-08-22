import { eq } from "drizzle-orm";
import { db } from "@/db";
import { zernioCredentials } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { zernio, type ZernioClient } from "./client";

/**
 * Returns a ready-to-call Zernio client for an org.
 *
 * Customers never see or provide this credential — it is a single
 * platform-level key we (the operator) hold in `ZERNIO_API_KEY`. Every org
 * maps to one Zernio *profile* under that one account; per-org rows in
 * `zernio_credentials` exist only for the rare case where an org has been
 * explicitly granted its own key via the admin dashboard (`admin_adjust`
 * style override) — that table is checked first and wins if present.
 */
export async function zernioForOrg(orgId: string): Promise<ZernioClient | null> {
  const row = await db.query.zernioCredentials.findFirst({
    where: eq(zernioCredentials.orgId, orgId),
  });
  if (row) {
    const key = decrypt({ ciphertext: row.ciphertext, iv: row.iv, tag: row.tag });
    return zernio(key);
  }
  const platformKey = process.env.ZERNIO_API_KEY;
  return platformKey ? zernio(platformKey) : null;
}

/** Legacy alias — Phase-1 pages call this. Prefer `zernioForOrg` in new code. */
export const zernioForWorkspace = zernioForOrg;
