"use client";

import Image from "next/image";
import Link from "next/link";
import type { Contestant, Event } from "@prisma/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { canShowVoteCounts, getVotingState } from "@/lib/events";
import { padContestantNumber } from "@/lib/utils";
import { VoteModal } from "@/components/voting/vote-modal";
import { useState } from "react";

export function ContestantCard({
  contestant,
  event,
}: {
  contestant: Contestant;
  event: Event;
}) {
  const [open, setOpen] = useState(false);
  const voting = getVotingState(event);
  const showVotes = canShowVoteCounts(event);

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-[var(--shadow)]">
        <Link
          href={`/events/${event.slug}/contestants/${contestant.slug}`}
          className="relative block aspect-[3/4] bg-navy"
        >
          <Image
            src={contestant.image}
            alt={contestant.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-dark">
            Contestant #{padContestantNumber(contestant.contestantNumber)}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-navy">
            <Link href={`/events/${event.slug}/contestants/${contestant.slug}`}>
              {contestant.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">{contestant.category}</p>
          {showVotes ? (
            <p className="mt-2 text-sm font-semibold text-navy">
              {contestant.voteCount.toLocaleString()} votes
            </p>
          ) : null}
          {voting === "open" ? (
            <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
              Vote for {contestant.name.split(" ")[0]}
            </Button>
          ) : (
            <ButtonLink
              href={`/events/${event.slug}/contestants/${contestant.slug}`}
              variant="outline"
              className="mt-4 w-full"
            >
              View profile
            </ButtonLink>
          )}
        </div>
      </article>
      {open ? (
        <VoteModal contestant={contestant} event={event} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
