import { EventCard } from "@/components/events/event-card";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustSection } from "@/components/home/trust";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/card";
import { getVotingState } from "@/lib/events";
import { getPublishedEvents } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const events = await getPublishedEvents();
  const featured = events.filter((event) => event.status === "LIVE" || getVotingState(event) === "open");
  const competitions = featured.filter((event) => event.mode !== "TICKETS_ONLY");

  return (
    <>
      <Hero />
      <section className="container-px py-16 md:py-20">
        <SectionHeading
          eyebrow="Happening now"
          title="Featured events"
          description="Currently active competitions and live experiences."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(featured.length ? featured : events.slice(0, 3)).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        {!events.length ? (
          <p className="mt-8 text-center text-muted">
            Events will appear here after the database is seeded.
          </p>
        ) : null}
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container-px">
          <SectionHeading
            eyebrow="Vote live"
            title="Current competitions"
            description="Support a contestant before voting closes."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(competitions.length ? competitions : events.slice(0, 4)).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/vote" variant="secondary">
              Vote Now
            </ButtonLink>
          </div>
        </div>
      </section>

      <HowItWorks />
      <TrustSection />
    </>
  );
}
