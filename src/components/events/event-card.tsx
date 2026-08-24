import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getPublicEventBadge } from "@/lib/events";
import { formatKes } from "@/lib/utils";
import type { Event, Organizer } from "@prisma/client";

type EventCardEvent = Event & { organizer?: Organizer | null };

export function EventCard({ event }: { event: EventCardEvent }) {
  const badge = getPublicEventBadge(event);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[var(--shadow)]">
      <Link href={`/events/${event.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-navy">
        <Image
          src={event.poster}
          alt={`${event.name} poster`}
          fill
          className="object-cover transition duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <Badge tone={badge} className="absolute left-3 top-3">
          {badge}
        </Badge>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
          {format(event.eventDate, "dd MMM yyyy")}
        </p>
        <h3 className="mt-1 text-xl font-semibold text-navy">
          <Link href={`/events/${event.slug}`}>{event.name}</Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin size={15} />
          {event.venue}, {event.location}
        </p>
        {event.votingEnd ? (
          <p className="mt-2 text-sm text-ink">
            Voting closes {format(event.votingEnd, "dd MMM yyyy, HH:mm")}
          </p>
        ) : null}
        {event.mode !== "TICKETS_ONLY" ? (
          <p className="mt-1 text-sm text-muted">Votes from {formatKes(event.votePrice)}</p>
        ) : null}
        <div className="mt-5">
          <ButtonLink href={`/events/${event.slug}`} className="w-full" variant="secondary">
            View Event
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
