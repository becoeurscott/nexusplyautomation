import Link from "next/link";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { friendlyError } from "@/lib/user-message";
import { NotReadyYet } from "../_components/not-ready";
import { StatusPill } from "../_components/status-pill";
import { toPosts, type SimplePost } from "../_lib/normalize";


export default async function PostsPage() {
  const { workspace } = await requireWorkspace();
  const client = await zernioForWorkspace(workspace.id);
  if (!client) {
    return <NotReadyYet title="My posts" what="your posts" />;
  }

  let posts: SimplePost[] = [];
  let error: string | null = null;
  try {
    posts = toPosts(await client.posts.list({ limit: 50 }));
  } catch (e) {
    error = friendlyError(e, "posts.list");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My posts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Everything you&apos;ve sent out or lined up to go out.
          </p>
        </div>
        <Link
          href="/app/compose"
          className="shrink-0 rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--nx-blue-hover)]"
        >
          New post
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && posts.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center">
          <div className="font-semibold text-white">No posts yet</div>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            When you create your first post, it will show up here so you can keep track
            of what went out and when.
          </p>
          <Link
            href="/app/compose"
            className="mt-5 inline-block rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--nx-blue-hover)]"
          >
            Create your first post
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="nx-glass rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <StatusPill status={p.status} />
              <div className="text-xs text-slate-400">
                {formatWhen(p.publishedAt, p.scheduledAt)}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
              {p.content?.slice(0, 240) ?? ""}
              {p.content && p.content.length > 240 ? "…" : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Upstream sends ISO timestamps, which rendered raw as
 * "2026-08-22T09:15:00.000Z". Show something readable, and say which it is.
 */
function formatWhen(publishedAt?: string | null, scheduledAt?: string | null): string {
  const raw = publishedAt ?? scheduledAt;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const when = d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return publishedAt ? `Posted ${when}` : `Goes out ${when}`;
}
