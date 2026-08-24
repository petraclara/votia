import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPaymentByApiRef } from "@/lib/payments/fulfill";
import { webhookChallengeValid } from "@/lib/payments/webhook";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const expectedChallenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
  if (!webhookChallengeValid(payload.challenge, expectedChallenge)) {
    return NextResponse.json({ error: "Invalid webhook challenge" }, { status: 401 });
  }

  const apiRef = typeof payload.api_ref === "string" ? payload.api_ref : null;
  const invoiceId = typeof payload.invoice_id === "string" ? payload.invoice_id : null;
  const state = typeof payload.state === "string" ? payload.state : null;

  await prisma.webhookEvent.create({
    data: {
      apiRef,
      invoiceId,
      state,
      payload,
    },
  });

  if (!apiRef) {
    return NextResponse.json({ received: true });
  }

  try {
    const result = await fulfillPaymentByApiRef(apiRef, invoiceId ?? undefined);
    await prisma.webhookEvent.updateMany({
      where: { apiRef, invoiceId },
      data: { processed: Boolean(result.ok) },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("IntaSend webhook processing failed", error);
    return NextResponse.json({ received: true }, { status: 500 });
  }
}
