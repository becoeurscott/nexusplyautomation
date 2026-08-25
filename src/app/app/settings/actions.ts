"use server";

import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import {
  createBillingPortalSession,
  createCheckoutSession,
  PlanNotPurchasableError,
  type BillingInterval,
} from "@/lib/payments/checkout";
import { friendlyError } from "@/lib/user-message";
import type { PlanCode } from "@/lib/i18n/pricing";

export type BillingActionState = { ok: false; message: string } | null;

/**
 * Starts a hosted Checkout Session and sends the browser there.
 *
 * `redirect()` throws internally by design (NEXT_REDIRECT) and Next.js
 * relies on that throw propagating undisturbed — it's called outside the
 * try/catch below on purpose. Only `createCheckoutSession` itself (a plan
 * that isn't Stripe-configured yet, or a genuine Stripe API failure) is
 * wrapped, so a real error surfaces as a message on the form instead of an
 * unhandled crash, while a successful redirect is never accidentally caught.
 */
export async function startCheckout(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const { workspace } = await requireWorkspace();
  const planCode = String(formData.get("planCode")) as PlanCode;
  const interval = String(formData.get("interval")) as BillingInterval;

  let url: string;
  try {
    url = await createCheckoutSession({ orgId: workspace.id, planCode, interval });
  } catch (e) {
    if (e instanceof PlanNotPurchasableError) {
      return { ok: false, message: "This plan isn't available to purchase yet." };
    }
    return { ok: false, message: friendlyError(e, "checkout.create") };
  }
  redirect(url);
}

/** Sends the customer to Stripe's own self-serve portal — card, invoices, cancel. */
export async function manageBilling(
  _prev: BillingActionState,
  _formData: FormData,
): Promise<BillingActionState> {
  const { workspace } = await requireWorkspace();

  let url: string;
  try {
    url = await createBillingPortalSession(workspace.id);
  } catch (e) {
    return { ok: false, message: friendlyError(e, "billing.portal") };
  }
  redirect(url);
}
