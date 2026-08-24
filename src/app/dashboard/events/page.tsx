import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardEventsPage() {
  const { user, organizer } = await requireOrganizer();
  const events = await prisma.event.findMany({
    where: user.role === "ADMIN" ? {} : { organizerId: organizer!.id },
    include: { _count: { select: { contestants: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-navy">Events</h1>
        <ButtonLink href="/dashboard/events/new">Create event</ButtonLink>
      </div>
      <div className="mt-6 grid gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/dashboard/events/${event.id}`}
            className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]"
          >
            <p className="text-xs font-bold uppercase text-teal-dark">{event.status}</p>
            <h2 className="mt-1 text-xl font-semibold text-navy">{event.name}</h2>
            <p className="text-sm text-muted">
              {event._count.contestants} contestants · {event.mode.replaceAll("_", " ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
