import { LifeBuoy } from "lucide-react";

/**
 * Shown when the workspace has no publishing connection yet.
 *
 * Previously these pages redirected to Settings, so clicking "Posts" silently
 * landed you on a different screen with no explanation. Staying put and saying
 * what's happening is far less disorienting.
 */
export function NotReadyYet({
  title,
  what,
}: {
  title: string;
  /** Plain-language name for what's unavailable, e.g. "your posts". */
  what: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="mt-8 rounded-2xl border border-white/10 nx-glass p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--nx-blue)]/25 text-[color:var(--nx-blue-soft)]">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div className="mt-4 text-lg font-semibold text-white">
          We&apos;re still setting up your account
        </div>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          As soon as your social accounts are linked, {what} will show up here. This
          usually only takes a little while — you don&apos;t need to do anything.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Been waiting longer than a day? Contact support and we&apos;ll sort it out.
        </p>
      </div>
    </div>
  );
}
