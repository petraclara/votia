import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accountReferenceFromApiRef,
  mapDarajaResultToState,
  parseStkCallback,
} from "./daraja-utils";

test("maps Daraja result codes to fulfillment states", () => {
  assert.equal(mapDarajaResultToState(0), "COMPLETE");
  assert.equal(mapDarajaResultToState("0"), "COMPLETE");
  assert.equal(mapDarajaResultToState(1032), "CANCELLED");
  assert.equal(mapDarajaResultToState(1037), "FAILED");
  assert.equal(mapDarajaResultToState(4999), "FAILED");
  assert.equal(mapDarajaResultToState(1), "FAILED");
  assert.equal(mapDarajaResultToState(null), "PENDING");
});

test("account reference is compact and within Daraja length", () => {
  const ref = accountReferenceFromApiRef("vote_123e4567-e89b-12d3-a456-426614174000");
  assert.ok(ref.length <= 12);
  assert.match(ref, /^[a-zA-Z0-9]+$/);
});

test("parses successful STK callback metadata", () => {
  const parsed = parseStkCallback({
    Body: {
      stkCallback: {
        MerchantRequestID: "m-1",
        CheckoutRequestID: "ws_CO_123",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 200 },
            { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
            { Name: "PhoneNumber", Value: 254712345678 },
            { Name: "TransactionDate", Value: 20260826153000 },
          ],
        },
      },
    },
  });

  assert.equal(parsed.checkoutRequestId, "ws_CO_123");
  assert.equal(parsed.resultCode, 0);
  assert.equal(parsed.amount, 200);
  assert.equal(parsed.mpesaReceiptNumber, "NLJ7RT61SV");
  assert.equal(parsed.phoneNumber, "254712345678");
});

test("parses cancelled STK callback without metadata", () => {
  const parsed = parseStkCallback({
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_456",
        ResultCode: 1032,
        ResultDesc: "Request cancelled by user",
      },
    },
  });
  assert.equal(parsed.resultCode, 1032);
  assert.equal(parsed.amount, null);
  assert.equal(parsed.mpesaReceiptNumber, null);
});
