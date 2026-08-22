import { db } from "@/db";
import { zernioCredentials } from "@/db/schema";
import { encrypt, keyPreview } from "@/lib/encryption";
import { zernio } from "./client";

export class InvalidCredentialError extends Error {}

/**
 * Verifies a connection key against the upstream API and persists it
 * encrypted for the org. Shared by Settings and the onboarding wizard so
 * both paths are validated identically.
 */
export async function saveZernioCredential(opts: {
  orgId: string;
  userId: string;
  key: string;
}): Promise<void> {
  const key = opts.key.trim();
  if (!key.startsWith("sk_") || key.length < 20) {
    throw new InvalidCredentialError("That doesn't look like a valid connection key.");
  }

  const client = zernio(key);
  try {
    await client.profiles.list();
  } catch (e) {
    throw new InvalidCredentialError(
      `We couldn't verify that key: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const enc = encrypt(key);
  await db
    .insert(zernioCredentials)
    .values({
      orgId: opts.orgId,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      tag: enc.tag,
      keyPreview: keyPreview(key),
      addedById: opts.userId,
    })
    .onConflictDoUpdate({
      target: zernioCredentials.orgId,
      set: {
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        tag: enc.tag,
        keyPreview: keyPreview(key),
        addedById: opts.userId,
        addedAt: new Date(),
      },
    });
}
