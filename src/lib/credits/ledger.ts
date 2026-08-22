import { eq, sql } from "drizzle-orm";
import { db, type DB } from "@/db";
import { creditLedger, organizations } from "@/db/schema";
import { CREDIT_PRICE_MAP } from "./prices";

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly orgId: string,
    public readonly needed: number,
    public readonly available: number,
    public readonly action: string,
  ) {
    super(`Insufficient credits: need ${needed}, have ${available} (action=${action})`);
    this.name = "InsufficientCreditsError";
  }
}

export class UnknownActionError extends Error {
  constructor(action: string) {
    super(`Unknown credit action key: ${action}`);
    this.name = "UnknownActionError";
  }
}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Executor = DB | Tx;

/** Read the current balance for an org from the ledger sum. Always source-of-truth. */
export async function getBalance(orgId: string, exec: Executor = db): Promise<number> {
  const [row] = await exec
    .select({ balance: sql<number>`coalesce(sum(${creditLedger.delta})::int, 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.orgId, orgId));
  return row?.balance ?? 0;
}

type LedgerWrite = {
  orgId: string;
  delta: number; // signed
  reason:
    | "plan_refill"
    | "top_up"
    | "action_debit"
    | "admin_adjust"
    | "refund"
    | "promo";
  refType?: string | null;
  refId?: string | null;
  actorUserId?: string | null;
  note?: string | null;
};

/**
 * Append a ledger row and update the org's cached balance. Runs in whatever
 * executor you pass (tx or db). Never mutate an existing row.
 */
export async function writeLedger(
  entry: LedgerWrite,
  exec: Executor = db,
): Promise<{ balanceAfter: number; id: string }> {
  const currentBalance = await getBalance(entry.orgId, exec);
  const balanceAfter = currentBalance + entry.delta;

  if (balanceAfter < 0) {
    throw new InsufficientCreditsError(
      entry.orgId,
      Math.abs(entry.delta),
      currentBalance,
      entry.refType ?? entry.reason,
    );
  }

  const [row] = await exec
    .insert(creditLedger)
    .values({
      orgId: entry.orgId,
      delta: entry.delta,
      reason: entry.reason,
      refType: entry.refType ?? null,
      refId: entry.refId ?? null,
      balanceAfter,
      actorUserId: entry.actorUserId ?? null,
      note: entry.note ?? null,
    })
    .returning({ id: creditLedger.id });

  await exec
    .update(organizations)
    .set({ creditBalanceCached: balanceAfter })
    .where(eq(organizations.id, entry.orgId));

  return { balanceAfter, id: row.id };
}

/** Convenience: debit an action by its price-table key. */
export async function debit(
  orgId: string,
  action: string,
  opts: { refId?: string; actorUserId?: string; multiplier?: number } = {},
  exec: Executor = db,
) {
  const unit = CREDIT_PRICE_MAP[action];
  if (unit === undefined) throw new UnknownActionError(action);
  const mult = opts.multiplier ?? 1;
  const total = unit * mult;
  if (total === 0) {
    // Free action — still record a zero-row for audit clarity? Skip — the
    // audit_events row is enough. Ledger stays clean.
    return { balanceAfter: await getBalance(orgId, exec), id: null };
  }
  return writeLedger(
    {
      orgId,
      delta: -total,
      reason: "action_debit",
      refType: action,
      refId: opts.refId,
      actorUserId: opts.actorUserId,
    },
    exec,
  );
}

/** Convenience: refund a previously-debited action. */
export async function refund(
  orgId: string,
  action: string,
  opts: { refId?: string; actorUserId?: string; multiplier?: number } = {},
  exec: Executor = db,
) {
  const unit = CREDIT_PRICE_MAP[action];
  if (unit === undefined) throw new UnknownActionError(action);
  const mult = opts.multiplier ?? 1;
  const total = unit * mult;
  if (total === 0) return { balanceAfter: await getBalance(orgId, exec), id: null };
  return writeLedger(
    {
      orgId,
      delta: total,
      reason: "refund",
      refType: action,
      refId: opts.refId,
      actorUserId: opts.actorUserId,
    },
    exec,
  );
}
