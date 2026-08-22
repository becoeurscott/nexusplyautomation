import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { zernioCredentials } from "@/db/schema";
import { encrypt, keyPreview } from "@/lib/encryption";
import { requireWorkspace } from "@/lib/workspace";
import { zernio } from "@/lib/zernio/client";

async function saveKey(formData: FormData) {
  "use server";
  const { session, workspace } = await requireWorkspace();
  const key = String(formData.get("apiKey") ?? "").trim();
  if (!key.startsWith("sk_") || key.length < 20) {
    throw new Error("Invalid Zernio key — should start with 'sk_' and be ~67 chars.");
  }

  // Verify by calling a cheap endpoint.
  const client = zernio(key);
  try {
    await client.profiles.list();
  } catch (e) {
    throw new Error(
      `Zernio rejected this key: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const enc = encrypt(key);
  await db
    .insert(zernioCredentials)
    .values({
      orgId: workspace.id,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      tag: enc.tag,
      keyPreview: keyPreview(key),
      addedById: session.user.id,
    })
    .onConflictDoUpdate({
      target: zernioCredentials.orgId,
      set: {
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        tag: enc.tag,
        keyPreview: keyPreview(key),
        addedById: session.user.id,
        addedAt: new Date(),
      },
    });

  revalidatePath("/app", "layout");
}

async function removeKey() {
  "use server";
  const { workspace } = await requireWorkspace();
  await db
    .delete(zernioCredentials)
    .where(eq(zernioCredentials.orgId, workspace.id));
  revalidatePath("/app", "layout");
}

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  const existing = await db.query.zernioCredentials.findFirst({
    where: eq(zernioCredentials.orgId, workspace.id),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Zernio API key</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your key is encrypted with AES-256-GCM using a server-side secret before it is
          written to the database. Only the last 4 chars are ever shown back to you.
        </p>

        {existing ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-slate-500">Current key</div>
                <div className="mt-1 font-mono">sk_••••••••••••{existing.keyPreview}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Added {existing.addedAt.toLocaleString()}
                </div>
              </div>
              <form action={removeKey}>
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            No key connected yet.
          </div>
        )}

        <form action={saveKey} className="mt-6 space-y-3">
          <label className="block text-sm">
            {existing ? "Rotate key" : "Paste your key"}
            <input
              type="password"
              name="apiKey"
              required
              placeholder="sk_..."
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono outline-none focus:border-[color:var(--nx-blue)]"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--nx-blue-hover)]"
          >
            {existing ? "Rotate key" : "Connect key"}
          </button>
        </form>
      </section>
    </div>
  );
}
