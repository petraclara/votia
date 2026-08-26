/**
 * End-to-end sandbox simulation without requiring a real phone PIN:
 * 1) Create a PENDING vote with a fake CheckoutRequestID (or use existing)
 * 2) POST a Daraja success callback
 * 3) Assert PAID + voteCount incremented exactly once
 * 4) POST the same callback again and assert no double credit
 */
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

async function postJson(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function getJson(path) {
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  const contestant = await prisma.contestant.findFirst({
    include: { event: true },
    orderBy: { createdAt: "asc" },
  });
  if (!contestant) throw new Error("No contestant found — seed the DB first.");

  const apiRef = `vote_${randomUUID()}`;
  const checkoutRequestId = `ws_CO_TEST_${Date.now()}`;
  const votesBefore = contestant.voteCount;
  const voteQuantity = 2;
  const amount = contestant.event.votePrice * voteQuantity;

  await prisma.voteTransaction.create({
    data: {
      eventId: contestant.eventId,
      contestantId: contestant.id,
      voteQuantity,
      amount,
      currency: "KES",
      apiRef,
      status: "PENDING",
      processed: false,
      mpesaCheckoutRequestId: checkoutRequestId,
      customerPhone: "254708374149",
    },
  });

  const health = await getJson("/api/webhooks/daraja");
  const failedCallback = await postJson("/api/webhooks/daraja", {
    Body: {
      stkCallback: {
        MerchantRequestID: "m-fail",
        CheckoutRequestID: `${checkoutRequestId}-other`,
        ResultCode: 1037,
        ResultDesc: "DS timeout user cannot be reached",
      },
    },
  });

  // Mark a separate pending tx failed via 1037 to prove terminal persistence path,
  // then fulfill the main one with success callback.
  const failRef = `vote_${randomUUID()}`;
  const failCheckout = `ws_CO_FAIL_${Date.now()}`;
  await prisma.voteTransaction.create({
    data: {
      eventId: contestant.eventId,
      contestantId: contestant.id,
      voteQuantity: 1,
      amount: contestant.event.votePrice,
      currency: "KES",
      apiRef: failRef,
      status: "PENDING",
      processed: false,
      mpesaCheckoutRequestId: failCheckout,
      customerPhone: "254708374149",
    },
  });

  const failCb = await postJson("/api/webhooks/daraja", {
    Body: {
      stkCallback: {
        MerchantRequestID: "m-fail-2",
        CheckoutRequestID: failCheckout,
        ResultCode: 1037,
        ResultDesc: "DS timeout user cannot be reached",
      },
    },
  });

  const successPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID: "m-ok",
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: `RCP${Date.now()}` },
            { Name: "PhoneNumber", Value: 254708374149 },
            { Name: "TransactionDate", Value: 20260826170000 },
          ],
        },
      },
    },
  };

  const first = await postJson("/api/webhooks/daraja", successPayload);
  const second = await postJson("/api/webhooks/daraja", successPayload);
  const status = await getJson(`/api/payments/status?ref=${encodeURIComponent(apiRef)}`);
  const statusAgain = await getJson(`/api/payments/status?ref=${encodeURIComponent(apiRef)}`);

  const tx = await prisma.voteTransaction.findUnique({ where: { apiRef } });
  const failedTx = await prisma.voteTransaction.findUnique({ where: { apiRef: failRef } });
  const after = await prisma.contestant.findUnique({ where: { id: contestant.id } });

  console.log(
    JSON.stringify(
      {
        webhookHealth: health,
        failedCallbackHttp: failCb.status,
        failedTxStatus: failedTx?.status,
        successFirstHttp: first.status,
        successSecondHttp: second.status,
        paymentStatus: status.json,
        paymentStatusAgain: statusAgain.json,
        txStatus: tx?.status,
        txProcessed: tx?.processed,
        receipt: tx?.mpesaReceiptNumber ?? null,
        votesBefore,
        votesAfter: after?.voteCount ?? null,
        votesDelta: (after?.voteCount ?? 0) - votesBefore,
        expectedDelta: voteQuantity,
        creditedOnce: (after?.voteCount ?? 0) - votesBefore === voteQuantity,
      },
      null,
      2,
    ),
  );

  if (failedTx?.status !== "FAILED") throw new Error("1037 did not persist FAILED");
  if (tx?.status !== "PAID" || !tx.processed) throw new Error("success callback did not PAID");
  if ((after?.voteCount ?? 0) - votesBefore !== voteQuantity) {
    throw new Error("vote count not credited exactly once");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
