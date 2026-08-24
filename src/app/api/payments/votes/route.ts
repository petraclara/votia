import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVotingState } from "@/lib/events";
import { createCheckout, isIntaSendConfigured, siteHost } from "@/lib/payments/intasend";
import { calculateVoteTotal } from "@/lib/payments/money";
import { voteCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isIntaSendConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured. Add IntaSend keys on the server." },
      { status: 503 },
    );
  }

  const parsed = voteCheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote request." }, { status: 400 });
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
  const firstName = parsed.data.customerName?.split(" ")[0];
  const lastName = parsed.data.customerName?.split(" ").slice(1).join(" ");

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
      customerPhone: parsed.data.customerPhone || null,
      customerName: parsed.data.customerName || null,
    },
  });

  try {
    const checkout = await createCheckout({
      amount,
      currency: "KES",
      api_ref: apiRef,
      email: parsed.data.customerEmail || undefined,
      phone_number: parsed.data.customerPhone || undefined,
      first_name: firstName,
      last_name: lastName,
      comment: `${parsed.data.voteQuantity} votes for ${contestant.name}`,
      redirect_url: `${siteHost()}/payment/success?ref=${apiRef}`,
    });

    await prisma.voteTransaction.update({
      where: { id: transaction.id },
      data: { intasendInvoiceId: checkout.invoiceId },
    });

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, apiRef });
  } catch (error) {
    await prisma.voteTransaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    console.error("IntaSend vote checkout failed", error);
    return NextResponse.json({ error: "Unable to start IntaSend checkout." }, { status: 502 });
  }
}
