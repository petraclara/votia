import { ContestantCard } from "@/components/events/contestant-card";
import { getActiveVotingEvents } from "@/lib/queries";

export const revalidate = 30;

export const metadata = {
  title: "Vote",
  description: "Vote for contestants in live Votia competitions.",
};

export default async function VotePage() {
  const events = await getActiveVotingEvents();

  return (
    <div className="container-px py-10 md:py-14">
      <h1 className="text-4xl font-semibold text-navy">Vote Now</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Choose an open competition, pick your favourite and pay securely.
      </p>
      <div className="mt-10 space-y-12">
        {events.map((event) => (
          <section key={event.id}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-navy">{event.name}</h2>
                <p className="text-sm text-muted">{event.venue}, {event.location}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {event.contestants.slice(0, 8).map((contestant) => (
                <ContestantCard key={contestant.id} contestant={contestant} event={event} />
              ))}
            </div>
          </section>
        ))}
        {!events.length ? (
          <p className="text-muted">No live voting competitions right now. Check Events for upcoming contests.</p>
        ) : null}
      </div>
    </div>
  );
}
