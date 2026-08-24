import "server-only";
import { prisma } from "@/lib/prisma";
import { getInvoiceStatus, parsePaidAmount } from "@/lib/payments/intasend";
import { decideVoteFulfillment, parseKesAmount } from "@/lib/payments/money";

function processingFeeFromInvoice(charges: string | number | undefined) {
  const parsed = parseKesAmount(charges);
  if (parsed === null) return 0;
  return Math.max(0, Math.round(parsed));
}

export async function fulfillPaymentByApiRef(apiRef: string, invoiceId?: string) {
  if (apiRef.startsWith("vote_")) {
    return fulfillVoteTransaction(apiRef, invoiceId);
  }
  if (apiRef.startsWith("ticket_")) {
    return fulfillTicketOrder(apiRef, invoiceId);
  }
  return { ok: false as const, reason: "unknown_ref" };
}

export async function fulfillVoteTransaction(apiRef: string, invoiceId?: string) {
  const existing = await prisma.voteTransaction.findUnique({
    where: { apiRef },
    include: { contestant: true, event: true },
  });
  if (!existing) return { ok: false as const, reason: "not_found" };

  const lookupId = invoiceId ?? existing.intasendInvoiceId;
  if (!lookupId) return { ok: false as const, reason: "missing_invoice" };

  const verified = await getInvoiceStatus(lookupId);
  const paidAmount = parsePaidAmount(verified.invoice?.value);
  const currency = verified.invoice?.currency ?? "KES";
  const reference = verified.invoice?.invoice_id ?? lookupId;
  const processingFee = processingFeeFromInvoice(verified.invoice?.charges ?? undefined);

  const decision = decideVoteFulfillment({
    processed: existing.processed,
    status: existing.status,
    expectedAmount: existing.amount,
    expectedCurrency: existing.currency,
    paidAmount,
    paidCurrency: currency,
    state: verified.invoice?.state,
  });

  if (decision === "already_processed") {
    return { ok: true as const, alreadyProcessed: true, transaction: existing };
  }

  if (decision === "failed" || decision === "cancelled") {
    await prisma.voteTransaction.updateMany({
      where: { id: existing.id, processed: false },
      data: {
        status: decision === "cancelled" ? "CANCELLED" : "FAILED",
        intasendInvoiceId: lookupId,
      },
    });
    return { ok: false as const, reason: decision };
  }

  if (decision === "not_complete") {
    return { ok: false as const, reason: "not_complete", state: verified.invoice?.state };
  }

  if (decision === "amount_mismatch") {
    return { ok: false as const, reason: "amount_mismatch" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.voteTransaction.updateMany({
      where: { id: existing.id, processed: false },
      data: {
        status: "PAID",
        processed: true,
        intasendInvoiceId: lookupId,
        intasendReference: reference,
        processingFee,
      },
    });

    if (claimed.count === 0) {
      return { alreadyProcessed: true };
    }

    await tx.contestant.update({
      where: { id: existing.contestantId },
      data: { voteCount: { increment: existing.voteQuantity } },
    });

    return { alreadyProcessed: false };
  });

  const transaction = await prisma.voteTransaction.findUnique({
    where: { apiRef },
    include: { contestant: true, event: true },
  });

  return { ok: true as const, ...result, transaction };
}

export async function fulfillTicketOrder(apiRef: string, invoiceId?: string) {
  const existing = await prisma.ticketOrder.findUnique({
    where: { apiRef },
    include: { ticket: true, event: true },
  });
  if (!existing) return { ok: false as const, reason: "not_found" };

  const lookupId = invoiceId ?? existing.intasendInvoiceId;
  if (!lookupId) return { ok: false as const, reason: "missing_invoice" };

  const verified = await getInvoiceStatus(lookupId);
  const paidAmount = parsePaidAmount(verified.invoice?.value);
  const currency = verified.invoice?.currency ?? "KES";
  const reference = verified.invoice?.invoice_id ?? lookupId;
  const processingFee = processingFeeFromInvoice(verified.invoice?.charges ?? undefined);

  const decision = decideVoteFulfillment({
    processed: existing.processed,
    status: existing.status,
    expectedAmount: existing.amount,
    expectedCurrency: existing.currency,
    paidAmount,
    paidCurrency: currency,
    state: verified.invoice?.state,
  });

  if (decision === "already_processed") {
    return { ok: true as const, alreadyProcessed: true, order: existing };
  }

  if (decision === "failed" || decision === "cancelled") {
    await prisma.ticketOrder.updateMany({
      where: { id: existing.id, processed: false },
      data: {
        status: decision === "cancelled" ? "CANCELLED" : "FAILED",
        intasendInvoiceId: lookupId,
      },
    });
    return { ok: false as const, reason: decision };
  }

  if (decision === "not_complete") {
    return { ok: false as const, reason: "not_complete", state: verified.invoice?.state };
  }

  if (decision === "amount_mismatch") {
    return { ok: false as const, reason: "amount_mismatch" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.ticketOrder.updateMany({
      where: { id: existing.id, processed: false },
      data: {
        status: "PAID",
        processed: true,
        intasendInvoiceId: lookupId,
        intasendReference: reference,
        processingFee,
      },
    });

    if (claimed.count === 0) {
      return { alreadyProcessed: true };
    }

    await tx.ticket.update({
      where: { id: existing.ticketId },
      data: { sold: { increment: existing.quantity } },
    });

    return { alreadyProcessed: false };
  });

  const order = await prisma.ticketOrder.findUnique({
    where: { apiRef },
    include: { ticket: true, event: true },
  });

  return { ok: true as const, ...result, order };
}
