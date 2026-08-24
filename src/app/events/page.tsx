import { Suspense } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { EventCardSkeleton } from "@/components/ui/skeleton";
import { getPublicEventBadge, getVotingState } from "@/lib/events";
import { getPublishedEvents } from "@/lib/queries";

export const revalidate = 60;

export const metadata = {
  title: "Events",
  description: "Browse active, upcoming and past Votia competitions and events.",
};

function matchesFilter(
  event: Awaited<ReturnType<typeof getPublishedEvents>>[number],
  filter: string,
) {
  const voting = getVotingState(event);
  const badge = getPublicEventBadge(event);
  if (filter === "active") return voting === "open" || event.status === "LIVE";
  if (filter === "upcoming") return voting === "coming_soon" || event.status === "UPCOMING";
  if (filter === "completed") return event.status === "COMPLETED" || badge === "Completed";
  return true;
}

async function EventGrid({ filter }: { filter: string }) {
  const events = await getPublishedEvents();
  const active = events.filter((event) => matchesFilter(event, "active"));
  const upcoming = events.filter((event) => matchesFilter(event, "upcoming"));
  const past = events.filter((event) => matchesFilter(event, "completed"));

  if (filter !== "all") {
    const filtered = events.filter((event) => matchesFilter(event, filter));
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {!filtered.length ? <p className="text-muted">No events in this category yet.</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-5 text-2xl font-semibold text-navy">Active Events</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-5 text-2xl font-semibold text-navy">Upcoming Events</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-5 text-2xl font-semibold text-navy">Past Events</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;

  return (
    <div className="container-px py-10 md:py-14">
      <h1 className="text-4xl font-semibold text-navy">Events</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Discover pageants, awards, campus competitions and live experiences.
      </p>
      <div className="mt-6">
        <Suspense>
          <EventFilters current={filter} />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <EventGrid filter={filter} />
        </Suspense>
      </div>
    </div>
  );
}
