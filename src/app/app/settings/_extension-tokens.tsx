"use client";

import { useActionState, useState } from "react";
import {
  createExtensionToken,
  revokeExtensionToken,
  type TokenActionState,
} from "./actions";

export type TokenRow = {
  id: string;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

/**
 * Generate / list / revoke tokens for the browser extension.
 *
 * A new token is displayed exactly once. That isn't a UX oversight to fix
 * later — the server stores only a hash, so there is genuinely nothing to show
 * again, and the copy says so plainly rather than letting someone assume they
 * can come back for it.
 */
export function ExtensionTokens({ tokens }: { tokens: TokenRow[] }) {
  const [state, submit, pending] = useActionState<TokenActionState, FormData>(
    createExtensionToken,
    null,
  );
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4">
      <form action={submit} className="flex flex-wrap items-end gap-3">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-xs text-slate-400">
            Name it <span className="text-slate-500">(so you know which is which)</span>
          </span>
          <input
            type="text"
            name="name"
            placeholder="My laptop"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[color:var(--nx-blue)]"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create token"}
        </button>
      </form>

      {state && !state.ok && (
        <p className="mt-2 text-xs text-red-300">{state.message}</p>
      )}

      {state?.ok && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="text-xs font-semibold text-amber-300">
            Copy this now — you won&apos;t be able to see it again.
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-slate-200">
              {state.token}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(state.token);
                setCopied(true);
              }}
              className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/5"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-300/80">
            Paste it into the NexusPly extension to connect it to this workspace.
          </p>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{t.name}</div>
                <div className="text-xs text-slate-500">
                  {t.lastUsedAt
                    ? `Last used ${t.lastUsedAt.toLocaleDateString()}`
                    : "Never used"}
                </div>
              </div>
              <form action={revokeExtensionToken}>
                <input type="hidden" name="tokenId" value={t.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-red-300"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
