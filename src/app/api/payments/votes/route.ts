import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVotingState } from "@/lib/events";
import { initiateStkPush, isDarajaConfigured } from "@/lib/payments/daraja";
import { normalizeMpesaPhone } from "@/lib/payments/phone";
import { calculateVoteTotal } from "@/lib/payments/money";
import { voteCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isDarajaConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured. Add Daraja credentials on the server." },
      { status: 503 },
    );
  }

  const parsed = voteCheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote request." }, { status: 400 });
  }

  const phone = normalizeMpesaPhone(parsed.data.customerPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Kenyan M-Pesa phone number (e.g. 07XXXXXXXX)." },
      { status: 400 },
    );
  }

  const contestant = await prisma.contestant.findUnique({
    where: { id: parsed.data.contestantId },
    include: { event: true },
  });
  if (!contestant || contestant.eventId !== parsed.data.eventId) {
    return NextResponse.json({ error: "Contestant not found." }, { status: 404 });
  }
  if (contestant.event.status === "DISABLED" || contestant.event.status === "DRAFT") {
    return NextResponse.json({ error: "This event is unavailable." }, { status: 400 });
  }
  if (getVotingState(contestant.event) !== "open") {
    return NextResponse.json({ error: "Voting is not open for this event." }, { status: 400 });
  }

  let amount: number;
  try {
    amount = calculateVoteTotal(contestant.event.votePrice, parsed.data.voteQuantity);
  } catch {
    return NextResponse.json({ error: "Invalid vote quantity or price." }, { status: 400 });
  }
  const apiRef = `vote_${randomUUID()}`;

  const transaction = await prisma.voteTransaction.create({
    data: {
      eventId: contestant.eventId,
      contestantId: contestant.id,
      voteQuantity: parsed.data.voteQuantity,
      amount,
      currency: "KES",
      apiRef,
      status: "PENDING",
      processed: false,
      customerEmail: parsed.data.customerEmail || null,
      customerPhone: phone,
      customerName: parsed.data.customerName || null,
    },
  });

  try {
    const stk = await initiateStkPush({
      amount,
      phone,
      apiRef,
      description: `Votes ${contestant.name}`.slice(0, 13),
    });

    await prisma.voteTransaction.update({
      where: { id: transaction.id },
      data: { mpesaCheckoutRequestId: stk.checkoutRequestId },
    });

    return NextResponse.json({
      apiRef,
      message: "Check your phone for the M-Pesa prompt and enter your PIN.",
    });
  } catch (error) {
    await prisma.voteTransaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    console.error("Daraja vote STK Push failed", {
      apiRef,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message.includes("CallBackURL") ||
              error.message.includes("callback") ||
              error.message.includes("phone") ||
              error.message.includes("DARAJA_CALLBACK")
              ? error.message
              : "Unable to start M-Pesa payment. Please try again."
            : "Unable to start M-Pesa payment. Please try again.",
      },
      { status: 502 },
    );
  }
}
