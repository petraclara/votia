import { prisma } from "@/lib/prisma";
import {
  organizerAmountDue,
  outstandingAmount,
  platformFeeFromGross,
  settlementStatusFromAmounts,
} from "@/lib/payments/money";

export function feeConfig() {
  const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
  const defaultPayoutFeeKes = Number(process.env.DEFAULT_PAYOUT_FEE_KES ?? "0");
  return {
    platformFeePercent: Number.isInteger(platformFeePercent) ? platformFeePercent : 10,
    defaultPayoutFeeKes: Number.isInteger(defaultPayoutFeeKes) ? defaultPayoutFeeKes : 0,
  };
}

export async function getEventLedger(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) return null;

  const [votes, tickets, settlements] = await Promise.all([
    prisma.voteTransaction.aggregate({
      where: { eventId, status: "PAID", processed: true },
      _sum: { amount: true, processingFee: true, voteQuantity: true },
    }),
    prisma.ticketOrder.aggregate({
      where: { eventId, status: "PAID", processed: true },
      _sum: { amount: true, processingFee: true, quantity: true },
    }),
    prisma.settlement.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const { platformFeePercent, defaultPayoutFeeKes } = feeConfig();
  const gross = (votes._sum.amount ?? 0) + (tickets._sum.amount ?? 0);
  const processingFees = (votes._sum.processingFee ?? 0) + (tickets._sum.processingFee ?? 0);
  const platformFee = platformFeeFromGross(gross, platformFeePercent);
  const payoutFee = defaultPayoutFeeKes;
  const organizerAmount = organizerAmountDue({
    gross,
    processingFees,
    platformFee,
    payoutFee,
  });
  const amountPaid = settlements.reduce((sum, item) => sum + item.amountPaid, 0);
  const outstanding = outstandingAmount(organizerAmount, amountPaid);

  return {
    event,
    votes: votes._sum.voteQuantity ?? 0,
    ticketsSold: tickets._sum.quantity ?? 0,
    gross,
    processingFees,
    platformFee,
    payoutFee,
    organizerAmount,
    amountPaid,
    outstanding,
    status: settlementStatusFromAmounts(organizerAmount, amountPaid),
    settlements,
  };
}
