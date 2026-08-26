import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTicketingOpen } from "@/lib/events";
import { initiateStkPush, isDarajaConfigured } from "@/lib/payments/daraja";
import { normalizeMpesaPhone } from "@/lib/payments/phone";
import { ticketCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isDarajaConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured. Add Daraja credentials on the server." },
      { status: 503 },
    );
  }

  const parsed = ticketCheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ticket request." }, { status: 400 });
  }

  const phone = normalizeMpesaPhone(parsed.data.customerPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Kenyan M-Pesa phone number (e.g. 07XXXXXXXX)." },
      { status: 400 },
    );
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    include: { event: true },
  });
  if (!ticket || ticket.eventId !== parsed.data.eventId) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  if (!isTicketingOpen(ticket.event)) {
    return NextResponse.json({ error: "Ticketing is closed for this event." }, { status: 400 });
  }

  const amount = ticket.price * parsed.data.quantity;
  if (!Number.isInteger(amount) || amount < 1) {
    return NextResponse.json(
      { error: "M-Pesa requires a ticket total of at least KES 1." },
      { status: 400 },
    );
  }

  const apiRef = `ticket_${randomUUID()}`;
  let orderId: string;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${ticket.id} FOR UPDATE`;
      const locked = await tx.ticket.findUnique({ where: { id: ticket.id } });
      if (!locked) {
        throw new Error("Ticket not found.");
      }

      const pending = await tx.ticketOrder.aggregate({
        where: { ticketId: ticket.id, status: "PENDING" },
        _sum: { quantity: true },
      });
      const reserved = locked.sold + (pending._sum.quantity ?? 0);
      if (reserved + parsed.data.quantity > locked.quantity) {
        throw new Error("Not enough tickets remaining.");
      }

      return tx.ticketOrder.create({
        data: {
          eventId: ticket.eventId,
          ticketId: ticket.id,
          quantity: parsed.data.quantity,
          amount,
          currency: "KES",
          apiRef,
          status: "PENDING",
          processed: false,
          customerName: parsed.data.customerName,
          customerPhone: phone,
          customerEmail: parsed.data.customerEmail,
        },
      });
    });
    orderId = order.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reserve tickets.";
    const soldOut = message.includes("Not enough tickets");
    return NextResponse.json(
      { error: soldOut ? "Not enough tickets remaining." : "Unable to start ticket payment." },
      { status: soldOut ? 400 : 500 },
    );
  }

  try {
    const stk = await initiateStkPush({
      amount,
      phone,
      apiRef,
      description: `Tickets ${ticket.name}`.slice(0, 13),
    });

    await prisma.ticketOrder.update({
      where: { id: orderId },
      data: { mpesaCheckoutRequestId: stk.checkoutRequestId },
    });

    return NextResponse.json({
      apiRef,
      message: "Check your phone for the M-Pesa prompt and enter your PIN.",
    });
  } catch (error) {
    await prisma.ticketOrder.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    });
    console.error("Daraja ticket STK Push failed", {
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
