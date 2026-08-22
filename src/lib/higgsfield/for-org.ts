import { eq } from "drizzle-orm";
import { db } from "@/db";
import { higgsfieldCredentials } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { higgsfield, type HiggsfieldClient } from "./client";

/**
 * Returns a Higgsfield client for the org, or null if no key connected.
 * Falls back to `process.env.HIGGSFIELD_API_KEY` when the org has no key
 * of its own — useful during Phase B1 dev before the settings page is wired.
 */
export async function higgsfieldForOrg(orgId: string): Promise<HiggsfieldClient | null> {
  const row = await db.query.higgsfieldCredentials.findFirst({
    where: eq(higgsfieldCredentials.orgId, orgId),
  });
  if (row) {
    const key = decrypt({ ciphertext: row.ciphertext, iv: row.iv, tag: row.tag });
    return higgsfield(key);
  }
  const fallback = process.env.HIGGSFIELD_API_KEY;
  return fallback ? higgsfield(fallback) : null;
}
