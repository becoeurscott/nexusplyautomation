import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { zernioCredentials } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { getBalance } from "@/lib/credits";
import { ArrowUpRight, Calendar, Coins, Download, Users2 } from "lucide-react";

export default async function DashboardPage() {
  const { session, workspace } = await requireWorkspace();

  const creds = await db.query.zernioCredentials.findFirst({
    where: eq(zernioCredentials.orgId, workspace.id),
  });

  const balance = await getBalance(workspace.id);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const firstName = (session.user.name ?? "there").split(" ")[0];

  let accountCount: number | string = "—";
  let profileCount: number | string = "—";
  if (creds) {
    const client = await zernioForWorkspace(workspace.id);
    if (client) {
      const [a, p] = await Promise.all([
        client.accounts.list().catch(() => null),
        client.profiles.list().catch(() => null),
      ]);
      accountCount = countOf(a);
      profileCount = countOf(p);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage posts, track performance, and collaborate seamlessly.
          </p>
        </div>
        <button className="hidden items-center gap-2 rounded-full bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)] sm:flex">
          <Download className="h-4 w-4" /> Export
        </button>
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
          <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-slate-50 p-2">
              <div className="text-slate-500">Accounts</div>
              <div className="mt-1 text-base font-bold text-slate-800">{accountCount}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <div className="text-slate-500">Profiles</div>
              <div className="mt-1 text-base font-bold text-slate-800">{profileCount}</div>
            </div>
          </div>
        </div>
      </div>

      {!creds && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-amber-900">Connect your Zernio key</div>
            <div className="text-xs text-amber-800">
              Posting, analytics, and inbox unlock once a key is saved. Encrypted at rest.
            </div>
          </div>
          <Link
            href="/app/settings"
            className="shrink-0 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Go to Settings
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs text-slate-500">Last update: just now</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action
              href="/app/compose"
              title="Compose a post"
              body="Cross-post to every account in one shot."
              icon={<ArrowUpRight className="h-4 w-4" />}
            />
            <Action
              href="/app/queue"
              title="Manage your queue"
              body="Set recurring slots so posts auto-publish."
              icon={<Calendar className="h-4 w-4" />}
            />
            <Action
              href="/app/accounts"
              title="Connected accounts"
              body="See what's linked and add more."
              icon={<Users2 className="h-4 w-4" />}
            />
            <Action
              href="/app/settings"
              title="Settings & keys"
              body="Rotate your Zernio key, manage credits."
              icon={<Coins className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Reminders</div>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { t: "09:00 am", l: "Review scheduled posts", p: "Low" },
              { t: "12:00 pm", l: "Reply to new comments", p: "Low" },
            ].map((r) => (
              <li key={r.l} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{r.t}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {r.p}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-700">{r.l}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
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
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dbeafe] text-[color:var(--nx-blue)]">
          {icon}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{body}</div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-1.5 w-2/3 rounded-full bg-[color:var(--nx-blue)]" />
      </div>
    </Link>
  );
}

function countOf(raw: unknown): number | string {
  if (Array.isArray(raw)) return raw.length;
  const d = (raw as { data?: unknown[] } | null)?.data;
  return Array.isArray(d) ? d.length : "—";
}
