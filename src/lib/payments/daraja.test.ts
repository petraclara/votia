import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accountReferenceFromApiRef,
  buildStkPassword,
  buildStkPushPayload,
  darajaApiBaseUrl,
  isPublicHttpsUrl,
  mapDarajaResultToState,
  nextPaymentPollMs,
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

test("selects sandbox vs production Daraja OAuth host from DARAJA_ENV", () => {
  assert.equal(darajaApiBaseUrl("sandbox"), "https://sandbox.safaricom.co.ke");
  assert.equal(darajaApiBaseUrl("production"), "https://api.safaricom.co.ke");
  assert.equal(darajaApiBaseUrl(undefined), "https://sandbox.safaricom.co.ke");
});

test("builds STK Push password as base64(shortcode + passkey + timestamp)", () => {
  const timestamp = "20260826120000";
  const expected = Buffer.from(`174379pass${timestamp}`).toString("base64");
  assert.equal(buildStkPassword("174379", "pass", timestamp), expected);
});

test("STK Push request contains the required Daraja fields", () => {
  const payload = buildStkPushPayload({
    shortcode: "174379",
    passkey: "pass",
    timestamp: "20260826120000",
    transactionType: "CustomerPayBillOnline",
    amount: 200,
    phone: "254712345678",
    partyB: "174379",
    callBackURL: "https://example.com/api/webhooks/daraja",
    accountReference: "voteabc12345",
    transactionDesc: "Votes Jane Doe!!!",
  });

  assert.equal(payload.BusinessShortCode, "174379");
  assert.equal(payload.Timestamp, "20260826120000");
  assert.equal(payload.TransactionType, "CustomerPayBillOnline");
  assert.equal(payload.Amount, 200);
  assert.equal(payload.PartyA, "254712345678");
  assert.equal(payload.PartyB, "174379");
  assert.equal(payload.PhoneNumber, "254712345678");
  assert.equal(payload.CallBackURL, "https://example.com/api/webhooks/daraja");
  assert.equal(payload.AccountReference, "voteabc12345");
  assert.equal(payload.TransactionDesc, "Votes Jane Do");
  assert.ok(payload.Password.length > 10);
  assert.ok(!JSON.stringify(payload).includes("passkey"));
});

test("rejects localhost callback URLs", () => {
  assert.equal(isPublicHttpsUrl("https://example.com/api/webhooks/daraja"), true);
  assert.equal(isPublicHttpsUrl("http://localhost:3000/api/webhooks/daraja"), false);
  assert.equal(isPublicHttpsUrl("https://127.0.0.1/api/webhooks/daraja"), false);
});

test("polling stops once payment is terminal and otherwise respects backoff", () => {
  assert.equal(nextPaymentPollMs({ terminal: true }), 0);
  assert.equal(
    nextPaymentPollMs({ terminal: false, retryAfterMs: 45_000, queryIntervalMs: 20_000, minMs: 5_000 }),
    45_000,
  );
  assert.equal(
    nextPaymentPollMs({ terminal: false, retryAfterMs: null, queryIntervalMs: 20_000, minMs: 5_000 }),
    20_000,
  );
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
