import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";

type PostRow = {
  id: string;
  status: string;
  content: string;
  scheduledAt?: string;
  publishedAt?: string;
  accounts?: { platform: string; name: string }[];
};

export default async function PostsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  if (!client) redirect("/app/settings");

  let posts: PostRow[] = [];
  let error: string | null = null;
  try {
    const raw = (await client.posts.list({ limit: 50 })) as {
      data?: PostRow[];
    } | PostRow[];
    posts = Array.isArray(raw) ? raw : (raw.data ?? []);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Posts</h1>
        <Link
          href="/app/compose"
          className="rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--nx-blue-hover)]"
        >
          New post
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && posts.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No posts yet.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {posts.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {p.status}
              </div>
              <div className="text-xs text-slate-500">
                {p.publishedAt ?? p.scheduledAt ?? ""}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">
              {p.content?.slice(0, 240) ?? ""}
              {p.content && p.content.length > 240 ? "…" : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
