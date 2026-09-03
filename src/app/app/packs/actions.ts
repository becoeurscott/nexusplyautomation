"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/workspace";
import { deletePack, generatePack, type PackLength, type PackResult } from "@/lib/packs";

export type { PackResult } from "@/lib/packs";

export async function createPack(
  _prev: PackResult | null,
  formData: FormData,
): Promise<PackResult> {
  const { workspace, session } = await requireWorkspace();
  const length = Number(formData.get("length")) === 30 ? 30 : 7;
  const brief = String(formData.get("brief") ?? "");

  const result = await generatePack(
    workspace.id,
    session.user.id,
    length as PackLength,
    brief,
  );
  if (result.ok) revalidatePath("/app/packs");
  return result;
}

export async function removePack(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("packId") ?? "");
  if (!id) return;
  await deletePack(workspace.id, id);
  revalidatePath("/app/packs");
}
