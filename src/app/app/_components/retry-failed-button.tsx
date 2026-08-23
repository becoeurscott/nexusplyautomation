"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { retryFailedPosts, type ActionState } from "../actions";

export function RetryFailedButton() {
  const [state, run, pending] = useActionState<ActionState, FormData>(
    async () => retryFailedPosts(),
    null,
  );

  return (
    <form action={run} className="flex items-center gap-3">
      <motion.button
        whileHover={pending ? undefined : { scale: 1.02 }}
        whileTap={pending ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-[color:var(--nx-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)] disabled:opacity-60"
      >
        <RefreshCw className={"h-4 w-4 " + (pending ? "animate-spin" : "")} />
        {pending ? "Trying again…" : "Try again"}
      </motion.button>
      {state && (
        <span className={"text-xs " + (state.ok ? "text-emerald-700" : "text-red-700")}>
          {state.message}
        </span>
      )}
    </form>
  );
}
