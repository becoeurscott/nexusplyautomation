"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { writeLedger } from "@/lib/credits";
import { db } from "@/db";
import { auditEvents, organizations, socialConnections, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/payments/stripe";

export async function adjustCredits(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error("Enter a non-zero whole number of credits.");
  }

  await writeLedger({
    orgId,
    delta: Math.trunc(delta),
    reason: "admin_adjust",
    actorUserId: session.user.id,
    note: note ?? undefined,
  });

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.credits.adjust",
    entityType: "organization",
    entityId: orgId,
    payload: { delta: Math.trunc(delta), note },
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}

export async function toggleOnboarded(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const nextValue = formData.get("nextValue") === "true";

  await db
    .update(organizations)
    .set({ onboardingCompletedAt: nextValue ? new Date() : null })
    .where(eq(organizations.id, orgId));

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.org.toggle_onboarded",
    entityType: "organization",
    entityId: orgId,
    payload: { nextValue },
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}

/**
 * Deletes the row rather than just marking it revoked — the tokens are
 * dead either way once disconnected here, so there's nothing left worth
 * keeping encrypted at rest. The audit_events row is the permanent record
 * that this happened, not the connection row itself.
 */
export async function disconnectSocialConnection(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const connectionId = String(formData.get("connectionId"));

  const [conn] = await db
    .select({ platform: socialConnections.platform, providerAccountId: socialConnections.providerAccountId })
    .from(socialConnections)
    .where(eq(socialConnections.id, connectionId));

  await db.delete(socialConnections).where(eq(socialConnections.id, connectionId));

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.connection.disconnect",
    entityType: "social_connection",
    entityId: connectionId,
    payload: conn ?? null,
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}

/**
 * Support-side cancel for a Stripe subscription. The Billing Portal covers
 * self-serve cancellation; this exists for cases that go through support
 * instead (a refund request, a dispute, someone who can't reach the portal).
 * Cancels on Stripe first — that's the actual billing truth — then lets the
 * `customer.subscription.deleted` webhook (src/app/api/webhooks/stripe)
 * reconcile our own `subscriptions` row, the same reconciliation path a
 * customer-initiated cancellation already goes through. No local status
 * write here: two independent paths writing the same field is exactly the
 * kind of drift the webhook's "always resync from Stripe" design avoids.
 */
export async function cancelStripeSubscription(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const orgId = String(formData.get("orgId"));
  const subscriptionId = String(formData.get("subscriptionId"));

  const [sub] = await db
    .select({ providerSubRef: subscriptions.providerSubRef, provider: subscriptions.provider })
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId));

  if (!sub?.providerSubRef || sub.provider !== "stripe") {
    throw new Error("Not a Stripe subscription.");
  }

  try {
    await stripe.subscriptions.cancel(sub.providerSubRef);
  } catch (e) {
    await db.insert(auditEvents).values({
      orgId,
      actorUserId: session.user.id,
      action: "admin.subscription.cancel",
      entityType: "subscription",
      entityId: subscriptionId,
      result: "error",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }

  await db.insert(auditEvents).values({
    orgId,
    actorUserId: session.user.id,
    action: "admin.subscription.cancel",
    entityType: "subscription",
    entityId: subscriptionId,
    payload: { providerSubRef: sub.providerSubRef },
    result: "ok",
  });

  revalidatePath(`/admin/organizations/${orgId}`);
}
