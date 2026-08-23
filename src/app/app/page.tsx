import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Check,
  Coins,
  Inbox,
  ListChecks,
  MessageSquare,
  Send,
  Settings,
  Users2,
} from "lucide-react";
import { db } from "@/db";
import { creditLedger } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { StatusPill } from "./_components/status-pill";
import { PlatformBadge } from "./_components/platform-badge";
import { RetryFailedButton } from "./_components/retry-failed-button";
import {
  bySoonest,
  compact,
  formatDateTime,
  metricsOf,
  num,
  rows,
  str,
  toPosts,
  type SimplePost,
} from "./_lib/normalize";

/** Metrics worth showing, in the order people care about them. */
const METRICS: { keys: string[]; label: string }[] = [
  { keys: ["impressions", "views", "videoViews", "reach"], label: "Views" },
  { keys: ["likes", "reactions", "favourites"], label: "Likes" },
  { keys: ["comments", "commentCount", "replies"], label: "Comments" },
  { keys: ["shares", "reposts", "retweets"], label: "Shares" },
  { keys: ["followers", "followerCount", "newFollowers"], label: "Followers" },
  { keys: ["engagementRate", "engagement"], label: "Engagement" },
];

export default async function DashboardPage() {
  const { session, workspace } = await requireWorkspace();

  if (!workspace.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const client = await zernioForWorkspace(workspace.id);
  const balance = await getBalance(workspace.id);

  // Every source is fetched together and every one can fail on its own —
  // one bad endpoint must not take the whole dashboard down with it.
  const [accountsRaw, postsRaw, failedRaw, analyticsRaw, commentsRaw, mentionsRaw] =
    client
      ? await Promise.all([
          client.accounts.list().catch(() => null),
          client.posts.list({ limit: 100 }).catch(() => null),
          client.posts.listFailed().catch(() => null),
          client.analytics.overview().catch(() => null),
          client.inbox.listComments().catch(() => null),
          client.inbox.listMentions().catch(() => null),
        ])
      : [null, null, null, null, null, null];

  const recentCredits = await db
    .select({
      id: creditLedger.id,
      delta: creditLedger.delta,
      reason: creditLedger.reason,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.orgId, workspace.id))
    .orderBy(desc(creditLedger.createdAt))
    .limit(4)
    .catch(() => []);

  const accounts = rows(accountsRaw);
  const posts = toPosts(postsRaw);
  const failed = toPosts(failedRaw);

  const now = Date.now();
  const upcoming = posts
    .filter((p) => {
      if (p.publishedAt) return false;
      const t = p.scheduledAt ? new Date(p.scheduledAt).getTime() : NaN;
      return !Number.isNaN(t) && t >= now;
    })
    .sort((a, b) => bySoonest(a.scheduledAt, b.scheduledAt))
    .slice(0, 4);

  const recent = posts
    .filter((p) => p.publishedAt)
    .sort((a, b) => bySoonest(b.publishedAt, a.publishedAt))
    .slice(0, 4);

  const metrics = readMetrics(analyticsRaw);
  const messages = [...rows(commentsRaw), ...rows(mentionsRaw)].slice(0, 4);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const firstName = (session.user.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you can do, all in one place.
        </p>
      </div>

      {/* Greeting + headline numbers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-[color:var(--nx-blue)] p-6 text-white lg:col-span-2">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div className="text-sm text-white/80">{today}</div>
          <div className="font-display mt-5 text-3xl font-bold">Hi, {firstName}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>{accounts.length} accounts</Pill>
            <Pill>{posts.length >= 100 ? "100+" : posts.length} posts</Pill>
            <Pill>{upcoming.length} lined up</Pill>
            <Pill>{balance} credits</Pill>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/app/compose"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[color:var(--nx-blue)] hover:bg-white/90"
            >
              Create a post
            </Link>
            <Link
              href="/app/posts"
              className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              See my posts
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Credits</div>
            <Coins className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full bg-[#dbeafe]">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--nx-blue)] text-lg font-bold text-white">
              {balance}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Used each time you post or create something with AI.
          </p>
          {recentCredits.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
              {recentCredits.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-slate-500">
                    {creditReason(c.reason)}
                  </span>
                  <span
                    className={
                      "ml-2 shrink-0 font-semibold " +
                      (c.delta >= 0 ? "text-emerald-600" : "text-slate-700")
                    }
                  >
                    {c.delta >= 0 ? "+" : ""}
                    {c.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!client && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-sm font-semibold text-amber-900">
            We&apos;re still setting up your account
          </div>
          <div className="text-xs text-amber-800">
            You&apos;ll be able to post as soon as your social accounts are linked.
            There&apos;s nothing you need to do.
          </div>
        </div>
      )}

      {/* Anything broken comes first, with the fix attached */}
      {failed.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm font-semibold text-red-900">
                  {failed.length} post{failed.length === 1 ? "" : "s"} didn&apos;t send
                </div>
                <div className="text-xs text-red-800">
                  This usually fixes itself on a second try.
                </div>
              </div>
            </div>
            <RetryFailedButton />
          </div>
          <ul className="mt-3 space-y-1.5">
            {failed.slice(0, 3).map((p) => (
              <li key={p.id} className="truncate text-xs text-red-900">
                {p.content ? p.content.slice(0, 90) : "Post"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Scheduled + recently published side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Going out next"
          icon={<CalendarClock className="h-4 w-4" />}
          href="/app/queue"
          linkLabel="Schedule"
          empty={
            upcoming.length === 0
              ? "Nothing scheduled yet. Create a post and pick a time for it to go out."
              : null
          }
        >
          {upcoming.map((p) => (
            <PostLine key={p.id} post={p} when={p.scheduledAt} />
          ))}
        </Panel>

        <Panel
          title="Recently posted"
          icon={<ListChecks className="h-4 w-4" />}
          href="/app/posts"
          linkLabel="All posts"
          empty={
            recent.length === 0
              ? "Nothing has gone out yet. Your published posts will show up here."
              : null
          }
        >
          {recent.map((p) => (
            <PostLine key={p.id} post={p} when={p.publishedAt} />
          ))}
        </Panel>
      </div>

      {/* Results + messages */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Your results"
          icon={<BarChart3 className="h-4 w-4" />}
          href="/app/analytics"
          linkLabel="Results"
          empty={
            metrics.length === 0
              ? "Once your posts have been out for a while, how they performed will show up here."
              : null
          }
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-lg font-bold text-slate-800">{m.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Latest messages"
          icon={<MessageSquare className="h-4 w-4" />}
          href="/app/inbox"
          linkLabel="Messages"
          empty={
            messages.length === 0
              ? "Comments and mentions from your accounts will appear here."
              : null
          }
        >
          {messages.map((m, i) => (
            <div
              key={str(m, "id") ?? String(i)}
              className="rounded-xl border border-slate-100 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold text-slate-700">
                  {str(m, "authorName", "author", "username", "from") ?? "Someone"}
                </div>
                <div className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(str(m, "createdAt", "created_at", "timestamp"))}
                </div>
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                {str(m, "text", "message", "content", "body") ?? ""}
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Accounts */}
      <Panel
        title="Your accounts"
        icon={<Users2 className="h-4 w-4" />}
        href="/app/accounts"
        linkLabel="All accounts"
        empty={
          accounts.length === 0
            ? "No accounts connected yet. We'll link them for you — nothing to set up."
            : null
        }
      >
        <div className="flex flex-wrap gap-2">
          {accounts.slice(0, 8).map((a, i) => (
            <div
              key={str(a, "id") ?? String(i)}
              className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2"
            >
              <span className="truncate text-sm text-slate-700">
                {str(a, "name", "username", "handle") ?? "Account"}
              </span>
              <PlatformBadge platform={str(a, "platform")} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Every part of the app, listed plainly */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="text-sm font-semibold">Everything you can do</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Action
            href="/app/compose"
            title="Create a post"
            body="Write once and send it to all your accounts."
            icon={<Send className="h-4 w-4" />}
          />
          <Action
            href="/app/posts"
            title="My posts"
            body="See what went out and what's lined up."
            icon={<ListChecks className="h-4 w-4" />}
          />
          <Action
            href="/app/queue"
            title="Schedule"
            body="Choose the times your posts go out."
            icon={<CalendarClock className="h-4 w-4" />}
            soon
          />
          <Action
            href="/app/analytics"
            title="Results"
            body="See how your posts are performing."
            icon={<BarChart3 className="h-4 w-4" />}
            soon
          />
          <Action
            href="/app/inbox"
            title="Messages"
            body="Read and reply to comments and mentions."
            icon={<Inbox className="h-4 w-4" />}
            soon
          />
          <Action
            href="/app/accounts"
            title="My accounts"
            body="See which social accounts are connected."
            icon={<Users2 className="h-4 w-4" />}
          />
          <Action
            href="/app/settings"
            title="Settings"
            body="Your workspace details and credits."
            icon={<Settings className="h-4 w-4" />}
          />
          <Action
            href="/onboarding"
            title="Redo setup"
            body="Update what we know about your brand."
            icon={<Check className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function Panel({
  title,
  icon,
  href,
  linkLabel,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  linkLabel: string;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dbeafe] text-[color:var(--nx-blue)]">
            {icon}
          </span>
          {title}
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs font-medium text-[color:var(--nx-blue)] hover:underline"
        >
          {linkLabel}
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {empty ? <p className="text-sm text-slate-500">{empty}</p> : children}
      </div>
    </section>
  );
}

function PostLine({ post, when }: { post: SimplePost; when: string | null }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <StatusPill status={post.status} />
        <span className="shrink-0 text-xs text-slate-400">{formatDateTime(when)}</span>
      </div>
      <div className="mt-1.5 line-clamp-2 text-sm text-slate-600">
        {post.content || "No text"}
      </div>
    </div>
  );
}

function Action({
  href,
  title,
  body,
  icon,
  soon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  soon?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-100 bg-white p-4 transition hover:border-[color:var(--nx-blue)] hover:shadow-[0_16px_40px_-24px_rgba(10,99,244,0.5)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-[color:var(--nx-blue)]">
          {icon}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{body}</div>
      {soon && (
        <div className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Coming soon
        </div>
      )}
    </Link>
  );
}

function readMetrics(raw: unknown): { label: string; value: string }[] {
  const m = metricsOf(raw);
  if (!m) return [];
  const out: { label: string; value: string }[] = [];
  for (const spec of METRICS) {
    const v = num(m, ...spec.keys);
    if (v === null) continue;
    const isRate = spec.label === "Engagement";
    out.push({
      label: spec.label,
      value: isRate ? `${v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1)}%` : compact(v),
    });
  }
  return out;
}

/**
 * Ledger reasons are a fixed enum of internal keys (see credit_ledger.reason).
 * Every one is mapped, so a customer never reads "action_debit".
 */
function creditReason(reason: string): string {
  const map: Record<string, string> = {
    plan_refill: "Monthly credits added",
    top_up: "Credits bought",
    action_debit: "Used for a post or AI creation",
    admin_adjust: "Adjusted by our team",
    refund: "Credits returned",
    promo: "Bonus credits",
  };
  return map[reason] ?? "Credit activity";
}
