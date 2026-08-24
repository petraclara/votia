"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertEventOwnership, requireApprovedOrganizer } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { contestantFormSchema } from "@/lib/validators";

async function assertEventOwner(eventId: string) {
  const { user, organizer } = await requireApprovedOrganizer();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  assertEventOwnership(user, organizer?.id ?? null, event.organizerId);
  return event;
}

export async function upsertContestantAction(eventId: string, formData: FormData, contestantId?: string) {
  await assertEventOwner(eventId);
  const parsed = contestantFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please complete the contestant form.");

  const slug = slugify(parsed.data.name);
  const data = {
    name: parsed.data.name,
    slug,
    contestantNumber: parsed.data.contestantNumber,
    category: parsed.data.category,
    bio: parsed.data.bio,
    image: parsed.data.image,
    instagram: parsed.data.instagram || null,
    twitter: parsed.data.twitter || null,
    tiktok: parsed.data.tiktok || null,
    facebook: parsed.data.facebook || null,
  };

  if (contestantId) {
    const contestant = await prisma.contestant.findUnique({ where: { id: contestantId } });
    if (!contestant || contestant.eventId !== eventId) {
      throw new Error("Forbidden");
    }
    await prisma.contestant.update({ where: { id: contestantId }, data });
  } else {
    await prisma.contestant.create({ data: { ...data, eventId } });
  }

  revalidatePath(`/dashboard/events/${eventId}/contestants`);
  revalidatePath(`/events`);
}

export async function deleteContestantAction(eventId: string, contestantId: string) {
  await assertEventOwner(eventId);
  const contestant = await prisma.contestant.findUnique({ where: { id: contestantId } });
  if (!contestant || contestant.eventId !== eventId) {
    throw new Error("Forbidden");
  }
  await prisma.contestant.delete({ where: { id: contestantId } });
  revalidatePath(`/dashboard/events/${eventId}/contestants`);
}
