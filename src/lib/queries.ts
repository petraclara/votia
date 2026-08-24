import { prisma } from "@/lib/prisma";
import { getVotingState } from "@/lib/events";

export async function getPublishedEvents() {
  try {
    return await prisma.event.findMany({
      where: { status: { notIn: ["DRAFT", "DISABLED"] } },
      include: {
        organizer: true,
        contestants: { orderBy: { contestantNumber: "asc" } },
        tickets: { orderBy: { price: "asc" } },
      },
      orderBy: { eventDate: "asc" },
    });
  } catch (error) {
    console.error("Failed to load events", error);
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    return await prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: true,
        contestants: { orderBy: { contestantNumber: "asc" } },
        tickets: { orderBy: { price: "asc" } },
      },
    });
  } catch (error) {
    console.error("Failed to load event", error);
    return null;
  }
}

export async function getContestantBySlugs(eventSlug: string, contestantSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;
  const contestant = event.contestants.find((item) => item.slug === contestantSlug);
  if (!contestant) return null;
  return { event, contestant };
}

export async function getActiveVotingEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: ["LIVE", "UPCOMING"] },
        mode: { in: ["VOTING_ONLY", "VOTING_AND_TICKETS"] },
      },
      include: {
        organizer: true,
        contestants: { orderBy: { contestantNumber: "asc" } },
        tickets: true,
      },
      orderBy: { votingEnd: "asc" },
    });
    return events.filter((event) => getVotingState(event) === "open");
  } catch (error) {
    console.error("Failed to load voting events", error);
    return [];
  }
}

export async function getTicketEvents() {
  try {
    return await prisma.event.findMany({
      where: {
        status: { notIn: ["DRAFT", "DISABLED", "COMPLETED"] },
        OR: [{ ticketingEnabled: true }, { mode: { in: ["TICKETS_ONLY", "VOTING_AND_TICKETS"] } }],
      },
      include: {
        organizer: true,
        tickets: { orderBy: { price: "asc" } },
        contestants: true,
      },
      orderBy: { eventDate: "asc" },
    });
  } catch (error) {
    console.error("Failed to load ticket events", error);
    return [];
  }
}
