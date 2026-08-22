import { eq } from "drizzle-orm";
import { db } from "@/db";
import { zernioCredentials } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { zernio, type ZernioClient } from "./client";

/**
 * Returns a ready-to-call Zernio client for an org, or null if
 * this org has not connected an API key yet.
 * Decrypts the stored key on the fly — never persist plaintext.
 */
export async function zernioForOrg(orgId: string): Promise<ZernioClient | null> {
  const row = await db.query.zernioCredentials.findFirst({
    where: eq(zernioCredentials.orgId, orgId),
  });
  if (!row) return null;
  const key = decrypt({ ciphertext: row.ciphertext, iv: row.iv, tag: row.tag });
  return zernio(key);
}

/** Legacy alias — Phase-1 pages call this. Prefer `zernioForOrg` in new code. */
export const zernioForWorkspace = zernioForOrg;
