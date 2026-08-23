import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans, subscriptions } from "@/db/schema";
import { writeLedger } from "@/lib/credits/ledger";

/**
 * The free trial every new workspace starts on.
 *
 * Before this existed, signing up created an organisation and nothing else:
 * no subscription row, and a credit balance of zero. The site advertised a
 * free trial and the sign-up page promised free credits, but a new account
 * landed on a dashboard that couldn't actually do anything.
 */
export const TRIAL_DAYS = 14;
export const TRIAL_PLAN_CODE = "starter";

/**
 * Put a freshly-created org on a trial of the entry plan.
 *
 * Deliberately never throws. Provisioning a workspace must not fail because
 * billing reference data is missing — someone signing up should always end up
 * with a usable account, even if that means an operator attaches the trial
 * later. Failures are logged instead.
 */
export async function startTrial(orgId: string): Promise<void> {
  try {
    const [plan] = await db
      .select({ id: plans.id, credits: plans.includedCredits })
      .from(plans)
      .where(and(eq(plans.code, TRIAL_PLAN_CODE), eq(plans.active, true)))
      .limit(1);

    if (!plan) {
      // `scripts/seed.ts` has not been run against this database.
      console.error(
        `[trial] no active plan "${TRIAL_PLAN_CODE}" — org ${orgId} has no trial`,
      );
      return;
    }

    const endsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(subscriptions).values({
      orgId,
      planId: plan.id,
      provider: "manual",
      status: "trialing",
      currentPeriodEnd: endsAt,
    });

    if (plan.credits > 0) {
      await writeLedger({
        orgId,
        delta: plan.credits,
        reason: "plan_refill",
        refType: "trial",
        note: `${TRIAL_DAYS}-day trial`,
      });
    }
  } catch (e) {
    console.error(`[trial] could not start trial for org ${orgId}`, e);
  }
}

export type TrialState = {
  /** The plan's monthly creation-credit allowance, for progress display. */
  monthlyCredits: number;
  planName: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  /** Whole days left; 0 on the last day, never negative. */
  daysLeft: number;
  endsAt: Date | null;
  expired: boolean;
};

/** Current subscription state for an org, or null if it has none. */
export async function getTrialState(orgId: string): Promise<TrialState | null> {
  const [row] = await db
    .select({
      status: subscriptions.status,
      endsAt: subscriptions.currentPeriodEnd,
      monthlyCredits: plans.includedCredits,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!row) return null;

  const endsAt = row.endsAt ?? null;
  const msLeft = endsAt ? endsAt.getTime() - Date.now() : 0;
  return {
    status: row.status,
    monthlyCredits: row.monthlyCredits,
    planName: row.planName,
    endsAt,
    daysLeft: endsAt ? Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))) : 0,
    expired: row.status === "trialing" && endsAt !== null && msLeft <= 0,
  };
}
