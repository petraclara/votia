import "server-only";
import { prisma } from "@/lib/prisma";
import {
  mapDarajaResultToState,
  queryStkStatus,
  type ParsedStkCallback,
} from "@/lib/payments/daraja";
import { decideVoteFulfillment } from "@/lib/payments/money";

type PaymentKind = "vote" | "ticket";

/** Minimum gap between Daraja STK Query calls for the same CheckoutRequestID. */
const MIN_STK_QUERY_INTERVAL_MS = 20_000;
/** Give callbacks a chance before the first STK Query. */
const CALLBACK_GRACE_MS = 15_000;
const RATE_LIMIT_BACKOFF_MS = 45_000;

const lastStkQueryAt = new Map<string, number>();
const stkQueryBlockedUntil = new Map<string, number>();
const inFlightReconcile = new Map<string, Promise<ReconcileResult>>();

export type PublicPaymentState = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type PaymentStatusPayload = {
  apiRef: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  state: PublicPaymentState;
  processed: boolean;
  terminal: boolean;
  amount: number;
  currency: string;
  mpesaReceiptNumber: string | null;
  nextPollMs: number;
  retryAfterMs: number | null;
};

type ReconcileResult = {
  ok: boolean;
  reason?: string;
  apiRef: string;
  alreadyProcessed?: boolean;
  rateLimited?: boolean;
  retryAfterMs?: number;
  state?: string;
};

function toPublicState(status: string, processed: boolean): PublicPaymentState {
  if (status === "PAID" && processed) return "SUCCESS";
  if (status === "FAILED") return "FAILED";
  if (status === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

function isTerminalStatus(status: string, processed: boolean) {
  return (
    (status === "PAID" && processed) ||
    status === "FAILED" ||
    status === "CANCELLED"
  );
}

async function findPaymentByCheckoutRequestId(checkoutRequestId: string) {
  const vote = await prisma.voteTransaction.findFirst({
    where: { mpesaCheckoutRequestId: checkoutRequestId },
    include: { contestant: true, event: true },
  });
  if (vote) return { kind: "vote" as const, record: vote };

  const ticket = await prisma.ticketOrder.findFirst({
    where: { mpesaCheckoutRequestId: checkoutRequestId },
    include: { ticket: true, event: true },
  });
  if (ticket) return { kind: "ticket" as const, record: ticket };

  return null;
}

async function findPaymentByApiRef(apiRef: string) {
  if (apiRef.startsWith("vote_")) {
    const record = await prisma.voteTransaction.findUnique({
      where: { apiRef },
      include: { contestant: true, event: true },
    });
    return record ? { kind: "vote" as const, record } : null;
  }
  if (apiRef.startsWith("ticket_")) {
    const record = await prisma.ticketOrder.findUnique({
      where: { apiRef },
      include: { ticket: true, event: true },
    });
    return record ? { kind: "ticket" as const, record } : null;
  }
  return null;
}

async function markTerminalStatus(
  kind: PaymentKind,
  id: string,
  status: "FAILED" | "CANCELLED",
  checkoutRequestId?: string | null,
) {
  if (kind === "vote") {
    await prisma.voteTransaction.updateMany({
      where: { id, processed: false, status: "PENDING" },
      data: {
        status,
        ...(checkoutRequestId
          ? { mpesaCheckoutRequestId: checkoutRequestId }
          : {}),
      },
    });
    return;
  }

  await prisma.ticketOrder.updateMany({
    where: { id, processed: false, status: "PENDING" },
    data: {
      status,
      ...(checkoutRequestId
        ? { mpesaCheckoutRequestId: checkoutRequestId }
        : {}),
    },
  });
}

async function creditVote(input: {
  id: string;
  contestantId: string;
  voteQuantity: number;
  checkoutRequestId: string;
  receiptNumber: string;
}) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.voteTransaction.updateMany({
      where: { id: input.id, processed: false },
      data: {
        status: "PAID",
        processed: true,
        mpesaCheckoutRequestId: input.checkoutRequestId,
        mpesaReceiptNumber: input.receiptNumber,
        processingFee: 0,
      },
    });

    if (claimed.count === 0) {
      return { alreadyProcessed: true };
    }

    await tx.contestant.update({
      where: { id: input.contestantId },
      data: { voteCount: { increment: input.voteQuantity } },
    });

    return { alreadyProcessed: false };
  });
}

async function creditTicket(input: {
  id: string;
  ticketId: string;
  quantity: number;
  checkoutRequestId: string;
  receiptNumber: string;
}) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.ticketOrder.updateMany({
      where: { id: input.id, processed: false },
      data: {
        status: "PAID",
        processed: true,
        mpesaCheckoutRequestId: input.checkoutRequestId,
        mpesaReceiptNumber: input.receiptNumber,
        processingFee: 0,
      },
    });

    if (claimed.count === 0) {
      return { alreadyProcessed: true };
    }

    await tx.ticket.update({
      where: { id: input.ticketId },
      data: { sold: { increment: input.quantity } },
    });

    return { alreadyProcessed: false };
  });
}

export async function fulfillFromDarajaCallback(parsed: ParsedStkCallback) {
  if (!parsed.checkoutRequestId) {
    return { ok: false as const, reason: "missing_checkout_request_id" };
  }

  const found = await findPaymentByCheckoutRequestId(parsed.checkoutRequestId);
  if (!found) {
    console.warn("Daraja callback for unknown CheckoutRequestID", {
      checkoutRequestId: parsed.checkoutRequestId,
      resultCode: parsed.resultCode,
    });
    return { ok: false as const, reason: "not_found" };
  }

  const { kind, record } = found;
  const state = mapDarajaResultToState(parsed.resultCode);

  const decision = decideVoteFulfillment({
    processed: record.processed,
    status: record.status,
    expectedAmount: record.amount,
    expectedCurrency: record.currency,
    paidAmount: parsed.amount,
    paidCurrency: "KES",
    state,
  });

  console.info("Daraja callback decision", {
    apiRef: record.apiRef,
    checkoutRequestId: parsed.checkoutRequestId,
    resultCode: parsed.resultCode,
    resultDesc: parsed.resultDesc,
    decision,
    expectedAmount: record.amount,
    paidAmount: parsed.amount,
  });

  if (decision === "already_processed") {
    return { ok: true as const, alreadyProcessed: true, apiRef: record.apiRef };
  }

  if (decision === "failed" || decision === "cancelled") {
    await markTerminalStatus(
      kind,
      record.id,
      decision === "cancelled" ? "CANCELLED" : "FAILED",
      parsed.checkoutRequestId,
    );
    return { ok: false as const, reason: decision, apiRef: record.apiRef };
  }

  if (decision === "not_complete") {
    return { ok: false as const, reason: "not_complete", apiRef: record.apiRef };
  }

  if (decision === "amount_mismatch") {
    console.error("Daraja amount mismatch — not crediting", {
      apiRef: record.apiRef,
      expected: record.amount,
      paid: parsed.amount,
    });
    await markTerminalStatus(kind, record.id, "FAILED", parsed.checkoutRequestId);
    return { ok: false as const, reason: "amount_mismatch", apiRef: record.apiRef };
  }

  if (!parsed.mpesaReceiptNumber) {
    return { ok: false as const, reason: "missing_receipt", apiRef: record.apiRef };
  }

  if (kind === "vote") {
    const result = await creditVote({
      id: record.id,
      contestantId: record.contestantId,
      voteQuantity: record.voteQuantity,
      checkoutRequestId: parsed.checkoutRequestId,
      receiptNumber: parsed.mpesaReceiptNumber,
    });
    return { ok: true as const, ...result, apiRef: record.apiRef };
  }

  const result = await creditTicket({
    id: record.id,
    ticketId: record.ticketId,
    quantity: record.quantity,
    checkoutRequestId: parsed.checkoutRequestId,
    receiptNumber: parsed.mpesaReceiptNumber,
  });
  return { ok: true as const, ...result, apiRef: record.apiRef };
}

async function reconcileOnce(apiRef: string): Promise<ReconcileResult> {
  const found = await findPaymentByApiRef(apiRef);
  if (!found) return { ok: false, reason: "not_found", apiRef };

  const { kind, record } = found;
  if (record.processed && record.status === "PAID") {
    return { ok: true, alreadyProcessed: true, apiRef };
  }

  if (record.status === "FAILED" || record.status === "CANCELLED") {
    return { ok: false, reason: record.status.toLowerCase(), apiRef };
  }

  const checkoutRequestId = record.mpesaCheckoutRequestId;
  if (!checkoutRequestId) {
    return { ok: false, reason: "missing_checkout_request_id", apiRef };
  }

  const creditWithReceipt = async (receiptNumber: string, paidAmount: number) => {
    const decision = decideVoteFulfillment({
      processed: record.processed,
      status: record.status,
      expectedAmount: record.amount,
      expectedCurrency: record.currency,
      paidAmount,
      paidCurrency: record.currency,
      state: "COMPLETE",
    });
    if (decision !== "credit") {
      return { ok: false, reason: decision, apiRef };
    }
    if (kind === "vote") {
      const result = await creditVote({
        id: record.id,
        contestantId: record.contestantId,
        voteQuantity: record.voteQuantity,
        checkoutRequestId,
        receiptNumber,
      });
      return { ok: true, ...result, apiRef };
    }
    const result = await creditTicket({
      id: record.id,
      ticketId: record.ticketId,
      quantity: record.quantity,
      checkoutRequestId,
      receiptNumber,
    });
    return { ok: true, ...result, apiRef };
  };

  // Callback already stored a receipt — credit without hitting Daraja again.
  if (record.mpesaReceiptNumber) {
    return creditWithReceipt(record.mpesaReceiptNumber, record.amount);
  }

  const ageMs = Date.now() - record.createdAt.getTime();
  if (ageMs < CALLBACK_GRACE_MS) {
    return {
      ok: false,
      reason: "awaiting_callback",
      apiRef,
      retryAfterMs: CALLBACK_GRACE_MS - ageMs,
    };
  }

  const blockedUntil = stkQueryBlockedUntil.get(checkoutRequestId) ?? 0;
  if (Date.now() < blockedUntil) {
    return {
      ok: false,
      reason: "rate_limited",
      apiRef,
      rateLimited: true,
      retryAfterMs: blockedUntil - Date.now(),
    };
  }

  const lastQuery = lastStkQueryAt.get(checkoutRequestId) ?? 0;
  const sinceLast = Date.now() - lastQuery;
  if (sinceLast < MIN_STK_QUERY_INTERVAL_MS) {
    return {
      ok: false,
      reason: "query_cooldown",
      apiRef,
      retryAfterMs: MIN_STK_QUERY_INTERVAL_MS - sinceLast,
    };
  }

  try {
    lastStkQueryAt.set(checkoutRequestId, Date.now());
    const queried = await queryStkStatus(checkoutRequestId);
    console.info("Daraja STK Query reconcile", {
      apiRef,
      checkoutRequestId,
      resultCode: queried.resultCode,
      state: queried.state,
      httpStatus: queried.httpStatus,
      rateLimited: queried.rateLimited,
    });

    if (queried.rateLimited) {
      stkQueryBlockedUntil.set(checkoutRequestId, Date.now() + RATE_LIMIT_BACKOFF_MS);
      return {
        ok: false,
        reason: "rate_limited",
        apiRef,
        rateLimited: true,
        retryAfterMs: RATE_LIMIT_BACKOFF_MS,
      };
    }

    // Terminal failures from STK Query (1037 timeout, 4999, insufficient funds, etc.)
    if (queried.state === "CANCELLED" || queried.state === "FAILED") {
      await markTerminalStatus(
        kind,
        record.id,
        queried.state === "CANCELLED" ? "CANCELLED" : "FAILED",
        checkoutRequestId,
      );
      return { ok: false, reason: queried.state.toLowerCase(), apiRef };
    }

    if (queried.state === "COMPLETE") {
      // Prefer real callback receipt; Query confirms success without metadata.
      const receipt = `QRY${checkoutRequestId.replace(/[^a-zA-Z0-9]/g, "").slice(-10)}`;
      return creditWithReceipt(receipt, record.amount);
    }

    return { ok: false, reason: "not_complete", apiRef, state: queried.state };
  } catch (error) {
    console.error("Daraja reconcile failed", {
      apiRef,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, reason: "query_failed", apiRef, retryAfterMs: MIN_STK_QUERY_INTERVAL_MS };
  }
}

/**
 * Idempotent reconcile: at most one in-flight job per apiRef.
 * Does not credit on STK Push acceptance — only callback/Query success.
 */
export async function fulfillPaymentByApiRef(apiRef: string): Promise<ReconcileResult> {
  const existing = inFlightReconcile.get(apiRef);
  if (existing) return existing;

  const job = reconcileOnce(apiRef).finally(() => {
    inFlightReconcile.delete(apiRef);
  });
  inFlightReconcile.set(apiRef, job);
  return job;
}

export async function getPaymentStatusByApiRef(
  apiRef: string,
): Promise<PaymentStatusPayload | null> {
  const found = await findPaymentByApiRef(apiRef);
  if (!found) return null;

  const { record } = found;
  const terminal = isTerminalStatus(record.status, record.processed);
  return {
    apiRef: record.apiRef,
    status: record.status,
    state: toPublicState(record.status, record.processed),
    processed: record.processed,
    terminal,
    amount: record.amount,
    currency: record.currency,
    mpesaReceiptNumber: record.mpesaReceiptNumber,
    nextPollMs: terminal ? 0 : MIN_STK_QUERY_INTERVAL_MS,
    retryAfterMs: null,
  };
}
