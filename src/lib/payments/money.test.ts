import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateVoteTotal,
  decideVoteFulfillment,
  organizerAmountDue,
  outstandingAmount,
  paidCoversExpected,
  platformFeeFromGross,
  settlementStatusFromAmounts,
} from "./money";

test("vote total is quantity times server price", () => {
  assert.equal(calculateVoteTotal(10, 20), 200);
  assert.equal(calculateVoteTotal(10, 1), 10);
});

test("vote total rejects invalid quantities", () => {
  assert.throws(() => calculateVoteTotal(10, 0));
  assert.throws(() => calculateVoteTotal(10, 10_001));
  assert.throws(() => calculateVoteTotal(10.5, 2));
});

test("underpayment is rejected and exact or higher payment is accepted", () => {
  assert.equal(paidCoversExpected(200, 199), false);
  assert.equal(paidCoversExpected(200, 200), true);
  assert.equal(paidCoversExpected(200, 205), true);
  assert.equal(paidCoversExpected(200, null), false);
});

test("duplicate paid transactions are not credited again", () => {
  assert.equal(
    decideVoteFulfillment({
      processed: true,
      status: "PAID",
      expectedAmount: 200,
      expectedCurrency: "KES",
      paidAmount: 200,
      paidCurrency: "KES",
      state: "COMPLETE",
    }),
    "already_processed",
  );
});

test("failed and incomplete payments do not credit votes", () => {
  const base = {
    processed: false,
    status: "PENDING",
    expectedAmount: 200,
    expectedCurrency: "KES",
    paidAmount: 200,
    paidCurrency: "KES",
  };
  assert.equal(decideVoteFulfillment({ ...base, state: "FAILED" }), "failed");
  assert.equal(decideVoteFulfillment({ ...base, state: "CANCELLED" }), "cancelled");
  assert.equal(decideVoteFulfillment({ ...base, state: "PROCESSING" }), "not_complete");
  assert.equal(
    decideVoteFulfillment({ ...base, paidAmount: 50, state: "COMPLETE" }),
    "amount_mismatch",
  );
  assert.equal(decideVoteFulfillment({ ...base, state: "COMPLETE" }), "credit");
});

test("already processed payments stay idempotent even if callback is replayed", () => {
  assert.equal(
    decideVoteFulfillment({
      processed: true,
      status: "PAID",
      expectedAmount: 200,
      expectedCurrency: "KES",
      paidAmount: 200,
      paidCurrency: "KES",
      state: "COMPLETE",
    }),
    "already_processed",
  );
});

test("platform fee is not treated as 100% of collections", () => {
  const gross = 1000;
  const processingFees = 30;
  const platformFee = platformFeeFromGross(gross, 10);
  const payoutFee = 0;
  const due = organizerAmountDue({ gross, processingFees, platformFee, payoutFee });
  assert.equal(platformFee, 100);
  assert.equal(due, 870);
  assert.equal(outstandingAmount(due, 200), 670);
  assert.equal(settlementStatusFromAmounts(due, 0), "PENDING");
  assert.equal(settlementStatusFromAmounts(due, 200), "PARTIALLY_SETTLED");
  assert.equal(settlementStatusFromAmounts(due, 870), "SETTLED");
});
