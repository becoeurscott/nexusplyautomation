import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { getPack } from "@/lib/packs";
import { PackDays } from "../_components/pack-generator";

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();

  // Scoped by org inside getPack — a draft id in the URL proves nothing.
  const pack = await getPack(workspace.id, id);
  if (!pack) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/packs" className="text-sm text-slate-400 hover:text-white">
        ← All packs
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold">
        Your {pack.days.length}-day plan
      </h1>
      {pack.brief && <p className="mt-2 text-sm text-slate-400">{pack.brief}</p>}
      <PackDays pack={pack} />
    </div>
  );
}
