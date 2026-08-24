const MAX_VOTES = 10_000;

export function calculateVoteTotal(pricePerVote: number, quantity: number) {
  if (!Number.isInteger(pricePerVote) || !Number.isInteger(quantity)) {
    throw new Error("Vote price and quantity must be whole numbers.");
  }
  if (pricePerVote < 1 || quantity < 1 || quantity > MAX_VOTES) {
    throw new Error("Invalid vote quantity or price.");
  }
  return pricePerVote * quantity;
}

export function paidCoversExpected(expected: number, paid: number | null) {
  if (paid === null || !Number.isFinite(paid)) return false;
  return Math.round(paid) >= expected;
}

export function parseKesAmount(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

export function platformFeeFromGross(gross: number, percent: number) {
  if (!Number.isInteger(gross) || gross < 0) {
    throw new Error("Gross amount must be a whole number.");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error("Platform fee percent must be 0-100.");
  }
  return Math.floor((gross * percent) / 100);
}

export function organizerAmountDue(input: {
  gross: number;
  processingFees: number;
  platformFee: number;
  payoutFee: number;
}) {
  return Math.max(
    0,
    input.gross - input.processingFees - input.platformFee - input.payoutFee,
  );
}

export function outstandingAmount(organizerAmount: number, amountPaid: number) {
  return Math.max(0, organizerAmount - amountPaid);
}

export function settlementStatusFromAmounts(organizerAmount: number, amountPaid: number) {
  if (amountPaid <= 0) return "PENDING" as const;
  if (amountPaid >= organizerAmount) return "SETTLED" as const;
  return "PARTIALLY_SETTLED" as const;
}

export type VoteFulfillDecision =
  | "already_processed"
  | "failed"
  | "cancelled"
  | "not_complete"
  | "amount_mismatch"
  | "credit";

export function decideVoteFulfillment(input: {
  processed: boolean;
  status: string;
  expectedAmount: number;
  expectedCurrency: string;
  paidAmount: number | null;
  paidCurrency: string;
  state?: string | null;
}): VoteFulfillDecision {
  if (input.processed && input.status === "PAID") return "already_processed";

  const state = (input.state ?? "").toUpperCase();
  if (state === "FAILED") return "failed";
  if (state === "CANCELLED") return "cancelled";
  if (state !== "COMPLETE") return "not_complete";
  if (input.paidCurrency !== input.expectedCurrency) return "amount_mismatch";
  if (!paidCoversExpected(input.expectedAmount, input.paidAmount)) return "amount_mismatch";
  return "credit";
}
