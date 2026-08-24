import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTicketingOpen } from "@/lib/events";
import { createCheckout, isIntaSendConfigured, siteHost } from "@/lib/payments/intasend";
import { ticketCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!isIntaSendConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured. Add IntaSend keys on the server." },
      { status: 503 },
    );
  }

  const parsed = ticketCheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ticket request." }, { status: 400 });
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
      customerPhone: parsed.data.customerPhone,
      customerEmail: parsed.data.customerEmail,
    },
  });

  try {
    const checkout = await createCheckout({
      amount,
      currency: "KES",
      api_ref: apiRef,
      email: parsed.data.customerEmail,
      phone_number: parsed.data.customerPhone,
      first_name: parsed.data.customerName.split(" ")[0],
      last_name: parsed.data.customerName.split(" ").slice(1).join(" "),
      comment: `${parsed.data.quantity} × ${ticket.name} for ${ticket.event.name}`,
      redirect_url: `${siteHost()}/payment/success?ref=${apiRef}`,
    });

    await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { intasendInvoiceId: checkout.invoiceId },
    });

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, apiRef });
  } catch (error) {
    await prisma.ticketOrder.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    console.error("IntaSend ticket checkout failed", error);
    return NextResponse.json({ error: "Unable to start IntaSend checkout." }, { status: 502 });
  }
}
