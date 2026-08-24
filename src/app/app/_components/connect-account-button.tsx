"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Link2, X } from "lucide-react";
import { requestAccountConnection, type ConnectRequestState } from "../actions";

const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
  { key: "threads", label: "Threads" },
  { key: "pinterest", label: "Pinterest" },
];

/**
 * The actual, visible "Connect account" control.
 *
 * Accounts pages used to only say "contact support" inside a paragraph —
 * no button, nothing to click. This is a real primary button that opens a
 * platform picker and submits `requestAccountConnection`, which logs the
 * request and hands it to a person by opening the customer's mail client
 * (see the comment on that action for why — there's no OAuth flow or
 * automated email yet, so pretending otherwise would be dishonest).
 */
export function ConnectAccountButton({
  variant = "primary",
}: {
  variant?: "primary" | "empty-state";
}) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [state, submit, pending] = useActionState<ConnectRequestState, FormData>(
    requestAccountConnection,
    null,
  );
  const openedMailRef = useRef(false);

  // Hand the request to a human the moment the server confirms it logged —
  // a real navigation (mailto:) rather than a link buried in copy.
  useEffect(() => {
    if (state?.ok && !openedMailRef.current) {
      openedMailRef.current = true;
      window.location.href = state.mailto;
    }
  }, [state]);

  function close() {
    setOpen(false);
    setPlatform(null);
    openedMailRef.current = false;
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "primary"
            ? "flex items-center gap-2 rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
            : "mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
        }
      >
        <Link2 className="h-4 w-4" />
        Connect account
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="nx-glass w-full max-w-md rounded-2xl p-6"
            >
              {state?.ok ? (
                <div className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <Check className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">Request sent</h2>
                  <p className="mt-2 text-sm text-slate-400">{state.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    We opened your email app so you can send the details straight to
                    support. Didn&apos;t open?{" "}
                    <a href={state.mailto} className="underline">
                      Click here
                    </a>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 w-full rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form action={submit}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Connect an account</h2>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Pick the platform, and we&apos;ll connect it for you — nothing to
                    set up on your side.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPlatform(p.key)}
                        className={
                          "rounded-xl border px-3 py-2.5 text-left text-sm transition " +
                          (platform === p.key
                            ? "border-[color:var(--nx-blue)] bg-[color:var(--nx-blue)]/15 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")
                        }
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="platform" value={platform ?? ""} />

                  <label className="mt-4 block text-sm text-slate-300">
                    Handle or page link{" "}
                    <span className="font-normal text-slate-500">(optional)</span>
                    <input
                      name="handle"
                      placeholder="@yourbusiness"
                      className="mt-1 block w-full rounded-[10px] border border-white/12 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[color:var(--nx-blue)]"
                    />
                  </label>

                  {state && !state.ok && (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                      {state.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!platform || pending}
                    className="mt-5 w-full rounded-xl bg-[color:var(--nx-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-50"
                  >
                    {pending ? "Sending…" : "Send request"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
