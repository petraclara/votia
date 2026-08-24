import { EventCard } from "@/components/events/event-card";
import { getTicketEvents } from "@/lib/queries";

export const revalidate = 60;

export const metadata = {
  title: "Tickets",
  description: "Buy Regular, VIP and VVIP tickets for Votia events.",
};

export default async function TicketsPage() {
  const events = await getTicketEvents();

  return (
    <div className="container-px py-10 md:py-14">
      <h1 className="text-4xl font-semibold text-navy">Tickets</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Secure your seat for live pageants, awards and campus events.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {!events.length ? <p className="mt-8 text-muted">No ticketed events are on sale yet.</p> : null}
    </div>
  );
}
