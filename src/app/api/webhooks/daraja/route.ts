import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStkCallback, type StkCallbackBody } from "@/lib/payments/daraja";
import { fulfillFromDarajaCallback } from "@/lib/payments/fulfill";

/** Health check so we can verify the tunnel/webhook path is reachable. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "daraja-webhook",
  });
}

export async function POST(request: Request) {
  const rawText = await request.text().catch(() => "");
  let payload: StkCallbackBody | null = null;
  try {
    payload = rawText ? (JSON.parse(rawText) as StkCallbackBody) : null;
  } catch {
    payload = null;
  }

  console.info("Daraja STK callback HTTP hit", {
    contentType: request.headers.get("content-type"),
    bodyPreview: rawText.replace(/\s+/g, " ").trim().slice(0, 300),
  });

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" }, { status: 400 });
  }

  const parsed = parseStkCallback(payload);

  await prisma.webhookEvent.create({
    data: {
      apiRef: null,
      invoiceId: parsed.checkoutRequestId,
      state: String(parsed.resultCode),
      payload,
    },
  });

  console.info("Daraja STK callback received", {
    checkoutRequestId: parsed.checkoutRequestId,
    merchantRequestId: parsed.merchantRequestId,
    resultCode: parsed.resultCode,
    resultDesc: parsed.resultDesc,
    amount: parsed.amount,
    hasReceipt: Boolean(parsed.mpesaReceiptNumber),
  });

  try {
    const result = await fulfillFromDarajaCallback(parsed);
    console.info("Daraja STK callback fulfilled", {
      checkoutRequestId: parsed.checkoutRequestId,
      apiRef: result.apiRef ?? null,
      ok: result.ok,
      reason: "reason" in result ? result.reason : null,
      alreadyProcessed: "alreadyProcessed" in result ? result.alreadyProcessed : false,
    });
    if (result.apiRef) {
      await prisma.webhookEvent.updateMany({
        where: { invoiceId: parsed.checkoutRequestId },
        data: {
          apiRef: result.apiRef,
          processed: Boolean(result.ok),
        },
      });
    }
    // Always acknowledge to Safaricom so they do not retry endlessly on business failures.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("Daraja webhook processing failed", {
      checkoutRequestId: parsed.checkoutRequestId,
      error: error instanceof Error ? error.message : "unknown",
    });
    // Acknowledge so Safaricom does not retry while we inspect logs.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
