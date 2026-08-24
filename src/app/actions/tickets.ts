"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertEventOwnership, requireApprovedOrganizer } from "@/lib/session";
import { ticketFormSchema } from "@/lib/validators";

async function assertEventOwner(eventId: string) {
  const { user, organizer } = await requireApprovedOrganizer();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  assertEventOwnership(user, organizer?.id ?? null, event.organizerId);
  return event;
}

export async function upsertTicketAction(eventId: string, formData: FormData, ticketId?: string) {
  await assertEventOwner(eventId);
  const parsed = ticketFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please complete the ticket form.");

  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.eventId !== eventId) {
      throw new Error("Forbidden");
    }
    await prisma.ticket.update({
      where: { id: ticketId },
      data: parsed.data,
    });
  } else {
    await prisma.ticket.create({
      data: { ...parsed.data, eventId },
    });
  }

  revalidatePath(`/dashboard/events/${eventId}/tickets`);
}

export async function deleteTicketAction(eventId: string, ticketId: string) {
  await assertEventOwner(eventId);
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.eventId !== eventId) {
    throw new Error("Forbidden");
  }
  await prisma.ticket.delete({ where: { id: ticketId } });
  revalidatePath(`/dashboard/events/${eventId}/tickets`);
}
