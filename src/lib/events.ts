import type { Event, EventStatus } from "@prisma/client";

export type VotingState = "coming_soon" | "open" | "closed" | "disabled";

export type PublicEventStatus =
  | "LIVE"
  | "Voting Open"
  | "Coming Soon"
  | "Voting Closed"
  | "Completed";

export function getVotingState(event: {
  status: EventStatus;
  votingStart: Date | null;
  votingEnd: Date | null;
  mode: string;
}): VotingState {
  if (event.status === "DISABLED") return "disabled";
  if (event.status === "DRAFT" || event.status === "COMPLETED") return "closed";
  if (event.mode === "TICKETS_ONLY") return "closed";
  if (!event.votingStart || !event.votingEnd) return "coming_soon";

  const now = Date.now();
  const start = event.votingStart.getTime();
  const end = event.votingEnd.getTime();

  if (now < start) return "coming_soon";
  if (now > end) return "closed";
  return "open";
}

export function getPublicEventBadge(event: {
  status: EventStatus;
  votingStart: Date | null;
  votingEnd: Date | null;
  eventDate: Date;
  mode: string;
}): PublicEventStatus {
  if (event.status === "COMPLETED") return "Completed";
  const voting = getVotingState(event);
  if (voting === "open") {
    return event.status === "LIVE" ? "LIVE" : "Voting Open";
  }
  if (voting === "coming_soon") return "Coming Soon";
  if (voting === "closed") return "Voting Closed";
  return "Completed";
}

export function canShowVoteCounts(
  event: Pick<Event, "voteVisibility" | "votingEnd">,
) {
  if (event.voteVisibility === "VISIBLE") return true;
  if (event.voteVisibility === "HIDDEN") return false;
  if (!event.votingEnd) return false;
  return Date.now() > event.votingEnd.getTime();
}

export function isTicketingOpen(event: {
  ticketingEnabled: boolean;
  mode: string;
  status: EventStatus;
  eventDate: Date;
}) {
  if (!event.ticketingEnabled && event.mode === "VOTING_ONLY") return false;
  if (event.status === "DISABLED" || event.status === "COMPLETED") return false;
  return event.eventDate.getTime() >= Date.now() - 12 * 60 * 60 * 1000;
}

export function filterLabel(filter: string) {
  if (filter === "upcoming") return "Upcoming";
  if (filter === "completed") return "Completed";
  if (filter === "active") return "Active";
  return "All";
}
