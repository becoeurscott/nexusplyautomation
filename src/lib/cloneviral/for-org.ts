import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cloneviralCredentials } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { cloneviral, type CloneViralClient } from "./client";

export async function cloneviralForOrg(orgId: string): Promise<CloneViralClient | null> {
  const row = await db.query.cloneviralCredentials.findFirst({
    where: eq(cloneviralCredentials.orgId, orgId),
  });
  if (row) {
    const key = decrypt({ ciphertext: row.ciphertext, iv: row.iv, tag: row.tag });
    return cloneviral(key);
  }
  const fallback = process.env.CLONEVIRAL_API_KEY;
  return fallback ? cloneviral(fallback) : null;
}
