import { inngest } from "../client";
import { db } from "@/db";
import { organizations, plans, subscriptions } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { writeLedger } from "@/lib/credits";

/**
 * Daily sweep — for every active subscription whose current period has ended,
 * top up the credits included in its plan and roll the period forward one month.
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
          if (s.includedCredits > 0) {
            await writeLedger(
              {
                orgId: s.orgId,
                delta: s.includedCredits,
                reason: "plan_refill",
                refType: "subscription",
                refId: s.subId,
                note: "Monthly plan refill",
              },
              tx,
            );
          }
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
 * One-off refill, kicked off manually (e.g. from admin dashboard).
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
    await writeLedger({
      orgId,
      delta: plan.includedCredits,
      reason: "plan_refill",
      note: "On-demand refill",
    });
    return { refilled: plan.includedCredits };
  },
);
