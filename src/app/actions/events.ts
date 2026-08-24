"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventMode, EventStatus, VoteVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApprovedOrganizer, requireOrganizer, assertEventOwnership } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { eventFormSchema } from "@/lib/validators";

async function ownedEvent(eventId: string) {
  const { user, organizer } = await requireOrganizer();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  assertEventOwnership(user, organizer?.id ?? null, event.organizerId);
  return event;
}

export async function createEventAction(formData: FormData) {
  const { user, organizer } = await requireApprovedOrganizer();
  if (!organizer && user.role !== "ADMIN") {
    throw new Error("Organizer profile missing");
  }

  const parsed = eventFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please complete all event fields.");

  let organizerId = organizer?.id;
  if (!organizerId && user.role === "ADMIN") {
    const first = await prisma.organizer.findFirst({ where: { status: "APPROVED" } });
    if (!first) throw new Error("No approved organizer available.");
    organizerId = first.id;
  }

  const slugBase = slugify(parsed.data.name);
  let slug = slugBase;
  let i = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`;
  }

  const event = await prisma.event.create({
    data: {
      organizerId: organizerId!,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      poster: parsed.data.poster,
      banner: parsed.data.banner,
      location: parsed.data.location,
      venue: parsed.data.venue,
      eventDate: new Date(parsed.data.eventDate),
      votingStart: parsed.data.votingStart ? new Date(parsed.data.votingStart) : null,
      votingEnd: parsed.data.votingEnd ? new Date(parsed.data.votingEnd) : null,
      votePrice: parsed.data.votePrice,
      mode: parsed.data.mode as EventMode,
      voteVisibility: parsed.data.voteVisibility as VoteVisibility,
      ticketingEnabled:
        parsed.data.mode === "TICKETS_ONLY" || parsed.data.mode === "VOTING_AND_TICKETS",
      status: (parsed.data.status as EventStatus | undefined) ?? "UPCOMING",
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${event.id}`);
}

export async function updateEventAction(eventId: string, formData: FormData) {
  await requireApprovedOrganizer();
  await ownedEvent(eventId);
  const parsed = eventFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please complete all event fields.");

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      poster: parsed.data.poster,
      banner: parsed.data.banner,
      location: parsed.data.location,
      venue: parsed.data.venue,
      eventDate: new Date(parsed.data.eventDate),
      votingStart: parsed.data.votingStart ? new Date(parsed.data.votingStart) : null,
      votingEnd: parsed.data.votingEnd ? new Date(parsed.data.votingEnd) : null,
      votePrice: parsed.data.votePrice,
      mode: parsed.data.mode as EventMode,
      voteVisibility: parsed.data.voteVisibility as VoteVisibility,
      ticketingEnabled:
        parsed.data.mode === "TICKETS_ONLY" || parsed.data.mode === "VOTING_AND_TICKETS",
      status: parsed.data.status as EventStatus | undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function setEventStatusAction(eventId: string, status: EventStatus) {
  await requireApprovedOrganizer();
  await ownedEvent(eventId);
  await prisma.event.update({ where: { id: eventId }, data: { status } });
  revalidatePath("/dashboard");
}

export async function openVotingAction(eventId: string) {
  await requireApprovedOrganizer();
  await ownedEvent(eventId);
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "LIVE", votingStart: new Date() },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function closeVotingAction(eventId: string) {
  await requireApprovedOrganizer();
  await ownedEvent(eventId);
  await prisma.event.update({
    where: { id: eventId },
    data: { votingEnd: new Date() },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
}
