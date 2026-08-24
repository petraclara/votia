import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import { ContestantCard } from "@/components/events/contestant-card";
import { TicketPurchase } from "@/components/tickets/ticket-purchase";
import { Badge } from "@/components/ui/badge";
import { getPublicEventBadge, getVotingState, isTicketingOpen } from "@/lib/events";
import { getEventBySlug, getPublishedEvents } from "@/lib/queries";
import { siteUrl } from "@/lib/utils";

export const revalidate = 30;

export async function generateStaticParams() {
  const events = await getPublishedEvents().catch(() => []);
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event" };
  return {
    title: event.name,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.name,
      description: event.description.slice(0, 160),
      images: [event.banner],
      url: siteUrl(`/events/${event.slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title: event.name,
      images: [event.banner],
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status === "DISABLED" || event.status === "DRAFT") notFound();

  const badge = getPublicEventBadge(event);
  const voting = getVotingState(event);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    startDate: event.eventDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    image: [event.banner, event.poster],
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.location,
    },
    organizer: {
      "@type": "Organization",
      name: event.organizer.organizationName,
    },
    url: siteUrl(`/events/${event.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative isolate min-h-[42vh] overflow-hidden bg-navy text-white">
        <Image
          src={event.banner}
          alt=""
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30" />
        <div className="container-px relative flex min-h-[42vh] items-end py-10">
          <div>
            <Badge tone={badge}>{badge}</Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold md:text-5xl">{event.name}</h1>
            <p className="mt-3 text-white/75">
              {format(event.eventDate, "EEEE, dd MMMM yyyy")} · {event.venue}, {event.location}
            </p>
          </div>
        </div>
      </section>

      <div className="container-px grid gap-8 py-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
            <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-navy">
              <Image src={event.poster} alt={`${event.name} poster`} fill className="object-cover" />
            </div>
            <h2 className="text-2xl font-semibold text-navy">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-muted">{event.description}</p>
          </div>

          {event.mode !== "TICKETS_ONLY" ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold text-navy">Contestants</h2>
              <p className="mt-1 text-sm text-muted">
                {voting === "open"
                  ? "Voting is open. Support your favourite contestant."
                  : "Profiles are available below."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {event.contestants.map((contestant) => (
                  <ContestantCard key={contestant.id} contestant={contestant} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Organizer</dt>
                <dd className="font-semibold text-navy">{event.organizer.organizationName}</dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="font-semibold text-navy">
                  {event.venue}, {event.location}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Date</dt>
                <dd className="font-semibold text-navy">{format(event.eventDate, "dd MMM yyyy")}</dd>
              </div>
              {event.votingStart ? (
                <div>
                  <dt className="text-muted">Voting starts</dt>
                  <dd className="font-semibold text-navy">
                    {format(event.votingStart, "dd MMM yyyy, HH:mm")}
                  </dd>
                </div>
              ) : null}
              {event.votingEnd ? (
                <div>
                  <dt className="text-muted">Voting deadline</dt>
                  <dd className="font-semibold text-navy">
                    {format(event.votingEnd, "dd MMM yyyy, HH:mm")}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone={badge} className="mt-1">
                    {badge}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>
          {isTicketingOpen(event) ? (
            <TicketPurchase event={event} tickets={event.tickets} />
          ) : null}
        </aside>
      </div>
    </>
  );
}
