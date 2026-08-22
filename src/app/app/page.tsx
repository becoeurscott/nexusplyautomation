import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { ArrowUpRight, Calendar, Check, Coins, Send, Users2 } from "lucide-react";

export default async function DashboardPage() {
  const { session, workspace } = await requireWorkspace();

  if (!workspace.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const client = await zernioForWorkspace(workspace.id);
  const balance = await getBalance(workspace.id);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const firstName = (session.user.name ?? "there").split(" ")[0];

  // Two numbers a customer can actually reason about. The previous "Profiles"
  // tile surfaced an upstream grouping concept that means nothing to someone
  // running a school page.
  let accountCount: number | null = null;
  let postCount: number | null = null;
  let postsCapped = false;
  if (client) {
    const [a, p] = await Promise.all([
      client.accounts.list().catch(() => null),
      client.posts.list({ limit: 100 }).catch(() => null),
    ]);
    accountCount = countOf(a);
    postCount = countOf(p);
    postsCapped = postCount === 100;
  }

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Write posts, send them to all your accounts, and see how they do.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Greeting banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[color:var(--nx-blue)] p-6 text-white lg:col-span-2">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div className="text-sm text-white/80">{today}</div>
          <div className="font-display mt-6 text-3xl font-bold">Hi, {firstName}</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-[color:var(--nx-blue)]">
              {balance}
            </span>
            credits available
          </div>
        </div>

        {/* Credits tile */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Credits</div>
            <Coins className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mx-auto mt-5 grid h-20 w-20 place-items-center rounded-full bg-[#dbeafe]">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--nx-blue)] text-lg font-bold text-white">
              {balance}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Credits are used each time you post or create something with AI.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-slate-50 p-2">
              <div className="text-slate-500">Accounts</div>
              <div className="mt-1 text-base font-bold text-slate-800">
                {accountCount ?? "—"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <div className="text-slate-500">Posts</div>
              <div className="mt-1 text-base font-bold text-slate-800">
                {postCount === null ? "—" : postsCapped ? "100+" : postCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!client && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-sm font-semibold text-amber-900">
            We&apos;re still setting up your account
          </div>
          <div className="text-xs text-amber-800">
            You&apos;ll be able to post as soon as your social accounts are linked.
            There&apos;s nothing you need to do — contact support if it takes more than a
            day.
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">What would you like to do?</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action
              href="/app/compose"
              title="Create a post"
              body="Write once and send it to all your accounts."
              icon={<Send className="h-4 w-4" />}
            />
            <Action
              href="/app/posts"
              title="See my posts"
              body="Check what went out and what's lined up."
              icon={<ArrowUpRight className="h-4 w-4" />}
            />
            <Action
              href="/app/accounts"
              title="My accounts"
              body="See which social accounts are connected."
              icon={<Users2 className="h-4 w-4" />}
            />
            <Action
              href="/app/queue"
              title="Set a schedule"
              body="Choose the times your posts go out."
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Real checklist driven by actual state — this replaced a hardcoded
            "Reminders" list that showed the same two fake items to everyone. */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="text-sm font-semibold">Getting started</div>
          <ul className="mt-4 space-y-3">
            <Step
              done={(accountCount ?? 0) > 0}
              label="Connect your social accounts"
              hint="We do this for you"
            />
            <Step
              done={(postCount ?? 0) > 0}
              label="Create your first post"
              href={(accountCount ?? 0) > 0 ? "/app/compose" : undefined}
              hint={(accountCount ?? 0) > 0 ? "Ready when you are" : "Once accounts are linked"}
            />
            <Step done={false} label="Set your posting schedule" hint="Coming soon" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function Step({
  done,
  label,
  hint,
  href,
}: {
  done: boolean;
  label: string;
  hint: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <span
        className={
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full " +
          (done ? "bg-emerald-500 text-white" : "border border-slate-300 bg-white")
        }
        aria-hidden
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <span className="min-w-0">
        <span
          className={
            "block text-sm " + (done ? "text-slate-500 line-through" : "text-slate-800")
          }
        >
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
    </div>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block transition hover:opacity-80">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

function Action({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
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
    </Link>
  );
}

function countOf(raw: unknown): number | null {
  if (Array.isArray(raw)) return raw.length;
  const d = (raw as { data?: unknown[] } | null)?.data;
  return Array.isArray(d) ? d.length : null;
}
