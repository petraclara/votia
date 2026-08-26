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
  if (ticket.sold + parsed.data.quantity > ticket.quantity) {
    return NextResponse.json({ error: "Not enough tickets remaining." }, { status: 400 });
  }

  const amount = ticket.price * parsed.data.quantity;
  const apiRef = `ticket_${randomUUID()}`;

  const order = await prisma.ticketOrder.create({
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

  try {
    const stk = await initiateStkPush({
      amount,
      phone,
      apiRef,
      description: `Tickets ${ticket.name}`.slice(0, 13),
    });

    await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { mpesaCheckoutRequestId: stk.checkoutRequestId },
    });

    return NextResponse.json({
      apiRef,
      checkoutRequestId: stk.checkoutRequestId,
      message:
        "Check your phone for the M-Pesa prompt and enter your PIN.",
    });
  } catch (error) {
    await prisma.ticketOrder.update({
      where: { id: order.id },
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
