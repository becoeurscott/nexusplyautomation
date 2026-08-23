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
  Sparkles,
  Users2,
} from "lucide-react";
import { db } from "@/db";
import { creditLedger } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { getTrialState } from "@/lib/billing/trial";
import { StatusPill } from "./_components/status-pill";
import { PlatformBadge, platformLabel } from "./_components/platform-badge";
import { RetryFailedButton } from "./_components/retry-failed-button";
import { Card, EmptyNote, Dial, Avatar, Bar } from "./_components/dashboard-ui";
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

const METRICS: { keys: string[]; label: string }[] = [
  { keys: ["impressions", "views", "videoViews", "reach"], label: "Views" },
  { keys: ["likes", "reactions", "favourites"], label: "Likes" },
  { keys: ["comments", "commentCount", "replies"], label: "Comments" },
  { keys: ["shares", "reposts", "retweets"], label: "Shares" },
  { keys: ["followers", "followerCount", "newFollowers"], label: "Followers" },
  { keys: ["engagementRate", "engagement"], label: "Engagement" },
];

/** Reference point for the credit dial — the smallest plan's monthly grant. */
const DIAL_MAX = 500;

export default async function DashboardPage() {
  const { session, workspace } = await requireWorkspace();

  if (!workspace.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const client = await zernioForWorkspace(workspace.id);
  const balance = await getBalance(workspace.id);
  const trial = await getTrialState(workspace.id);

  // Every source is fetched together and each catches on its own — one bad
  // endpoint degrades a single panel instead of the whole page.
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
      refType: creditLedger.refType,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.orgId, workspace.id))
    .orderBy(desc(creditLedger.createdAt))
    .limit(3)
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
  const messages = [...rows(commentsRaw), ...rows(mentionsRaw)].slice(0, 3);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const firstName = (session.user.name ?? "there").split(" ")[0];

  const steps = [
    { done: accounts.length > 0, label: "Connect your accounts", hint: "We do this for you" },
    { done: posts.length > 0, label: "Create your first post", hint: "Ready when you are" },
    { done: upcoming.length > 0, label: "Schedule something", hint: "Keep your page active" },
  ];
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Everything you can do, all in one place.
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-400">
          {today}
        </span>
      </div>

      {/* Anything broken comes first, with the fix attached */}
      {failed.length > 0 && (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <div className="text-sm font-semibold text-red-200">
                  {failed.length} post{failed.length === 1 ? "" : "s"} didn&apos;t send
                </div>
                <div className="text-xs text-red-300">
                  This usually fixes itself on a second try.
                </div>
              </div>
            </div>
            <RetryFailedButton />
          </div>
        </section>
      )}

      {/* Row 1 — greeting, credits dial, setup progress.
          Columns start at md: below lg everything used to collapse into a
          single full-width stack, so every laptop under 1024px got a very
          long scroll with three-quarters of the width unused. */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* self-start so the card hugs its content — grid rows stretch every
            item to the tallest panel by default, which left a tall band of
            empty blue under the buttons. */}
        <div className="relative self-start overflow-hidden rounded-2xl bg-[color:var(--nx-blue)] p-6 text-white md:col-span-12 lg:col-span-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="font-display text-2xl font-bold">Hi, {firstName}</div>
            <p className="mt-1 text-sm text-white/80">{workspace.name}</p>
            {trial?.status === "trialing" && (
              <p className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                {trial.expired
                  ? "Your free trial has ended"
                  : `Free trial · ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`}
              </p>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Stat label="Accounts" value={accounts.length} />
              <Stat label="Posts" value={posts.length >= 100 ? "100+" : posts.length} />
              <Stat label="Lined up" value={upcoming.length} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/app/compose"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[color:var(--nx-blue)] transition hover:bg-white/90"
              >
                Create a post
              </Link>
              <Link
                href="/app/posts"
                className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                My posts
              </Link>
            </div>
          </div>
        </div>

        <Card title="Credits" icon={<Coins className="h-4 w-4" />} className="md:col-span-5 lg:col-span-3">
          <Dial value={balance} max={DIAL_MAX} />
          <p className="mt-3 text-center text-xs text-slate-400">
            Used each time you post or create something with AI.
          </p>
          {recentCredits.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
              {recentCredits.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-400">{creditReason(c.reason, c.refType)}</span>
                  <span
                    className={
                      "shrink-0 font-semibold " +
                      (c.delta >= 0 ? "text-emerald-600" : "text-slate-200")
                    }
                  >
                    {c.delta >= 0 ? "+" : ""}
                    {c.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Getting started"
          icon={<Sparkles className="h-4 w-4" />}
          className="md:col-span-7 lg:col-span-4"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {stepsDone} of {steps.length} done
            </span>
            <span>{Math.round((stepsDone / steps.length) * 100)}%</span>
          </div>
          <div className="mt-2">
            <Bar pct={(stepsDone / steps.length) * 100} />
          </div>
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                <span
                  className={
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full " +
                    (s.done ? "bg-emerald-500 text-white" : "border border-white/25 bg-transparent")
                  }
                  aria-hidden
                >
                  {s.done && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={
                      "block text-sm " +
                      (s.done ? "text-slate-400 line-through" : "text-white")
                    }
                  >
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{s.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {!client && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <div className="text-sm font-semibold text-amber-200">
            We&apos;re still setting up your account
          </div>
          <div className="text-xs text-amber-300">
            You&apos;ll be able to post as soon as your social accounts are linked.
          </div>
        </div>
      )}

      {/* Row 2 — schedule + results rail */}
      <div className="grid gap-4 md:grid-cols-12">
        <Card
          title="Going out next"
          icon={<CalendarClock className="h-4 w-4" />}
          href="/app/queue"
          linkLabel="Schedule"
          className="md:col-span-7 lg:col-span-8"
        >
          {upcoming.length === 0 ? (
            <EmptyNote>
              Nothing scheduled yet. Create a post and pick a time for it to go out.
            </EmptyNote>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((p) => (
                <PostCard key={p.id} post={p} when={p.scheduledAt} />
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Your results"
          icon={<BarChart3 className="h-4 w-4" />}
          href="/app/analytics"
          linkLabel="Results"
          className="md:col-span-5 lg:col-span-4"
        >
          {metrics.length === 0 ? (
            <EmptyNote>
              Once your posts have been out for a while, how they performed shows up here.
            </EmptyNote>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-lg font-bold text-white">{m.value}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3 — recent, messages, accounts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Recently posted"
          icon={<ListChecks className="h-4 w-4" />}
          href="/app/posts"
          linkLabel="All"
        >
          {recent.length === 0 ? (
            <EmptyNote>Nothing has gone out yet.</EmptyNote>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => (
                <PostCard key={p.id} post={p} when={p.publishedAt} />
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Latest messages"
          icon={<MessageSquare className="h-4 w-4" />}
          href="/app/inbox"
          linkLabel="All"
        >
          {messages.length === 0 ? (
            <EmptyNote>Comments and mentions will appear here.</EmptyNote>
          ) : (
            <div className="space-y-2">
              {messages.map((m, i) => {
                const who = str(m, "authorName", "author", "username", "from") ?? "Someone";
                return (
                  <div
                    key={str(m, "id") ?? String(i)}
                    className="flex gap-3 nx-glass-soft rounded-xl p-3"
                  >
                    <Avatar name={who} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-200">
                          {who}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDateTime(str(m, "createdAt", "created_at", "timestamp"))}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-300">
                        {str(m, "text", "message", "content", "body") ?? ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Your accounts"
          icon={<Users2 className="h-4 w-4" />}
          href="/app/accounts"
          linkLabel="All"
        >
          {accounts.length === 0 ? (
            <EmptyNote>
              No accounts connected yet. We&apos;ll link them for you.
            </EmptyNote>
          ) : (
            <div className="space-y-2">
              {accounts.slice(0, 5).map((a, i) => {
                const name = str(a, "name", "username", "handle") ?? "Account";
                return (
                  <div
                    key={str(a, "id") ?? String(i)}
                    className="flex items-center gap-3 nx-glass-soft rounded-xl p-3"
                  >
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {platformLabel(str(a, "platform"))}
                      </div>
                    </div>
                    <PlatformBadge platform={str(a, "platform")} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Every part of the app stays visible */}
      <Card title="Everything you can do" icon={<Sparkles className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <Action href="/app/compose" title="Create a post" body="Write once, send everywhere." icon={<Send className="h-4 w-4" />} />
          <Action href="/app/posts" title="My posts" body="What went out and what's next." icon={<ListChecks className="h-4 w-4" />} />
          <Action href="/app/queue" title="Schedule" body="Choose when posts go out." icon={<CalendarClock className="h-4 w-4" />} soon />
          <Action href="/app/analytics" title="Results" body="See how posts perform." icon={<BarChart3 className="h-4 w-4" />} soon />
          <Action href="/app/inbox" title="Messages" body="Reply to comments and mentions." icon={<Inbox className="h-4 w-4" />} soon />
          <Action href="/app/accounts" title="My accounts" body="Your connected accounts." icon={<Users2 className="h-4 w-4" />} />
          <Action href="/app/settings" title="Settings" body="Workspace and credits." icon={<Settings className="h-4 w-4" />} />
          <Action href="/onboarding" title="Redo setup" body="Update your brand details." icon={<Check className="h-4 w-4" />} />
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/15 px-2 py-2.5">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-white/75">{label}</div>
    </div>
  );
}

function PostCard({ post, when }: { post: SimplePost; when: string | null }) {
  return (
    <div className="nx-glass-soft rounded-xl p-3 transition hover:border-white/15">
      <div className="flex items-center justify-between gap-2">
        <StatusPill status={post.status} />
        <span className="shrink-0 text-xs text-slate-400">{formatDateTime(when)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-300">
        {post.content || "No text"}
      </p>
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
      className="group nx-glass-soft rounded-xl p-4 transition hover:border-[color:var(--nx-blue)] hover:shadow-[0_16px_40px_-24px_rgba(10,99,244,0.5)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-[color:var(--nx-blue-soft)]">
          {icon}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-400">{body}</div>
      {soon && (
        <div className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
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
function creditReason(reason: string, refType?: string | null): string {
  if (reason === "plan_refill" && refType === "trial") return "Trial credits added";
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
