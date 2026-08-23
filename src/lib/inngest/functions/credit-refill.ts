import { inngest } from "../client";
import { db } from "@/db";
import { organizations, plans, subscriptions } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { getBalance, writeLedger } from "@/lib/credits";

/**
 * Daily sweep — for every active subscription whose period has ended, RESET the
 * balance to the plan's monthly allowance and roll the period forward.
 *
 * Reset, not top-up. Adding the allowance each cycle let an idle account
 * accumulate indefinitely, so someone could sit on a $19 plan for a year and
 * then burn 6,000 credits at once — which breaks the margin the whole pricing
 * model depends on. Credits are a monthly allowance, not a savings account.
 *
 * The correction is written as one signed ledger entry rather than a wipe and
 * re-grant, so the ledger still reconciles to the balance and history stays
 * readable.
 *
 * NOTE: this resets the entire balance because there is currently only one.
 * Once purchased credit packs are sellable they must be held in a separate
 * bucket that survives this reset — see TOP_UP_PACKS in lib/i18n/pricing.ts.
 */
export const creditPlanRefill = inngest.createFunction(
  {
    id: "credit-plan-refill",
    retries: 3,
    triggers: [{ cron: "TZ=Etc/UTC 5 0 * * *" }], // 00:05 UTC daily
  },
  async ({ step }) => {
    const now = new Date();

    const due = await step.run("find-due-subs", async () =>
      db
        .select({
          subId: subscriptions.id,
          orgId: subscriptions.orgId,
          planId: subscriptions.planId,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          includedCredits: plans.includedCredits,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(plans.id, subscriptions.planId))
        .where(
          and(
            eq(subscriptions.status, "active"),
            lte(subscriptions.currentPeriodEnd, now),
          ),
        ),
    );

    for (const s of due) {
      await step.run(`refill-${s.subId}`, async () =>
        db.transaction(async (tx) => {
          const current = await getBalance(s.orgId, tx);
          const delta = s.includedCredits - current;
          if (delta !== 0) {
            await writeLedger(
              {
                orgId: s.orgId,
                delta,
                reason: "plan_refill",
                refType: "subscription",
                refId: s.subId,
                note:
                  delta > 0
                    ? `Monthly credits reset to ${s.includedCredits}`
                    : `Unused credits expired; reset to ${s.includedCredits}`,
              },
              tx,
            );
          }
          // Always one month, whatever the billing interval: the allowance is
          // monthly for everyone, and an annual subscriber paying up front
          // still gets their credits month by month. Rolling this forward a
          // year for them would hand out one allowance for twelve months.
          // When real billing lands, the payment period needs its own field
          // rather than sharing this one.
          const nextEnd = new Date(now);
          nextEnd.setUTCMonth(nextEnd.getUTCMonth() + 1);
          await tx
            .update(subscriptions)
            .set({ currentPeriodEnd: nextEnd })
            .where(eq(subscriptions.id, s.subId));
        }),
      );
    }

    return { refilled: due.length };
  },
);

/**
 * One-off reset, kicked off manually (e.g. from the admin dashboard).
 *
 * Resets to the plan allowance rather than adding to it, matching the daily
 * sweep — an operator who wants to *grant* extra credits uses the admin
 * credit-adjust action, which is recorded separately as `admin_adjust`.
 */
export const creditPlanRefillOnDemand = inngest.createFunction(
  {
    id: "credit-plan-refill-ondemand",
    retries: 2,
    triggers: [{ event: "credit.plan_refill.requested" }],
  },
  async ({ event }) => {
    const orgId = (event.data as { orgId?: string }).orgId;
    if (!orgId) return { skipped: true, reason: "no orgId" };
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org?.planId) return { skipped: true, reason: "no active plan" };

    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, org.planId))
      .limit(1);
    if (!plan || plan.includedCredits <= 0) {
      return { skipped: true, reason: "no included credits" };
    }
    const current = await getBalance(orgId);
    const delta = plan.includedCredits - current;
    if (delta !== 0) {
      await writeLedger({
        orgId,
        delta,
        reason: "plan_refill",
        note: `Reset to plan allowance (${plan.includedCredits})`,
      });
    }
    return { balance: plan.includedCredits, delta };
  },
);
