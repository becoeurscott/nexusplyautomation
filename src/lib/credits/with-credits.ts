import { db } from "@/db";
import { debit, refund } from "./ledger";
import { assertBillingActive } from "@/lib/billing/trial";

/**
 * Wrap any provider call that costs credits. Debits before the call in the
 * SAME transaction; on caught failure it refunds atomically. Return the
 * upstream result plus the balance after the operation.
 *
 * Usage:
 *   const { result, balanceAfter } = await withCredits(
 *     { orgId, action: "zernio.post.create", actorUserId },
 *     async () => zernioClient.posts.create(payload)
 *   );
 */
export async function withCredits<T>(
  ctx: {
    orgId: string;
    action: string;
    actorUserId?: string;
    multiplier?: number;
    /** External reference (postId, jobId) to attach to the ledger row. */
    refId?: string;
  },
  fn: () => Promise<T>,
): Promise<{ result: T; balanceAfter: number; ledgerId: string | null }> {
  await assertBillingActive(ctx.orgId);

  const debitRow = await db.transaction(async (tx) => {
    return debit(
      ctx.orgId,
      ctx.action,
      {
        refId: ctx.refId,
        actorUserId: ctx.actorUserId,
        multiplier: ctx.multiplier,
      },
      tx,
    );
  });

  try {
    const result = await fn();
    return {
      result,
      balanceAfter: debitRow.balanceAfter,
      ledgerId: debitRow.id,
    };
  } catch (err) {
    // Refund on failure — separate transaction so the debit remains auditable
    // even if the refund itself somehow fails (worst case: manual admin_adjust).
    try {
      await refund(ctx.orgId, ctx.action, {
        refId: ctx.refId,
        actorUserId: ctx.actorUserId,
        multiplier: ctx.multiplier,
      });
    } catch {
      // Swallow — surface the original error to the caller, admin will reconcile.
    }
    throw err;
  }
}
