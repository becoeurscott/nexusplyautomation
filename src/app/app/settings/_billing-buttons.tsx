"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { startCheckout, manageBilling, type BillingActionState } from "./actions";

/**
 * useActionState rather than a plain `<form action={...}>` because both
 * server actions can fail before ever reaching `redirect()` — a plan that
 * isn't Stripe-configured yet, or a genuine Stripe API error — and that
 * needs to show up as a message on the page, not a silent no-op click or an
 * unhandled crash. Same pattern as RetryFailedButton and ConnectAccountButton.
 */
export function ChangePlanButton({
  planCode,
  interval,
  label,
  primary,
}: {
  planCode: string;
  interval: "monthly" | "annual";
  label: string;
  primary?: boolean;
}) {
  const [state, submit, pending] = useActionState<BillingActionState, FormData>(
    startCheckout,
    null,
  );

  return (
    <form action={submit}>
      <input type="hidden" name="planCode" value={planCode} />
      <input type="hidden" name="interval" value={interval} />
      <motion.button
        whileHover={pending ? undefined : { scale: 1.02 }}
        whileTap={pending ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        type="submit"
        disabled={pending}
        className={
          "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 " +
          (primary
            ? "bg-[color:var(--nx-blue)] text-white hover:bg-[color:var(--nx-blue-hover)]"
            : "border border-white/15 text-white hover:bg-white/5")
        }
      >
        {pending ? "Taking you to checkout…" : label}
      </motion.button>
      {state && !state.ok && (
        <p className="mt-2 text-xs text-red-300">{state.message}</p>
      )}
    </form>
  );
}

export function ManageBillingButton() {
  const [state, submit, pending] = useActionState<BillingActionState, FormData>(
    manageBilling,
    null,
  );

  return (
    <form action={submit}>
      <motion.button
        whileHover={pending ? undefined : { scale: 1.02 }}
        whileTap={pending ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12 }}
        type="submit"
        disabled={pending}
        className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-60"
      >
        {pending ? "Opening…" : "Manage billing"}
      </motion.button>
      {state && !state.ok && (
        <p className="mt-2 text-xs text-red-300">{state.message}</p>
      )}
    </form>
  );
}
