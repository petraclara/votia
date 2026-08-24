import { notFound } from "next/navigation";
import Link from "next/link";
import { EventForm } from "@/components/dashboard/event-form";
import { closeVotingAction, openVotingAction, updateEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, organizer } = await requireOrganizer();
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      contestants: true,
      tickets: true,
      voteTransactions: { where: { status: "PAID" } },
    },
  });
  if (!event) notFound();
  if (user.role !== "ADMIN" && event.organizerId !== organizer?.id) notFound();

  const votes = event.voteTransactions
    .filter((item) => item.processed)
    .reduce((sum, item) => sum + item.voteQuantity, 0);

  async function save(formData: FormData) {
    "use server";
    await updateEventAction(id, formData);
  }
  async function openVoting() {
    "use server";
    await openVotingAction(id);
  }
  async function closeVoting() {
    "use server";
    await closeVotingAction(id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h1 className="text-3xl font-semibold text-navy">{event.name}</h1>
        <p className="text-sm text-muted">{votes} confirmed votes</p>
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <EventForm action={save} event={event} />
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <h2 className="font-semibold text-navy">Voting controls</h2>
          <form action={openVoting} className="mt-3">
            <Button type="submit" className="w-full">
              Open voting
            </Button>
          </form>
          <form action={closeVoting} className="mt-3">
            <Button type="submit" variant="secondary" className="w-full">
              Close voting
            </Button>
          </form>
        </div>
        <Link href={`/dashboard/events/${event.id}/contestants`} className="block rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <h2 className="font-semibold text-navy">Contestants</h2>
          <p className="text-sm text-muted">{event.contestants.length} contestants</p>
        </Link>
        <Link href={`/dashboard/events/${event.id}/tickets`} className="block rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <h2 className="font-semibold text-navy">Tickets</h2>
          <p className="text-sm text-muted">{event.tickets.length} categories</p>
        </Link>
        <Link href={`/events/${event.slug}`} className="block text-sm font-semibold text-navy">
          View public page
        </Link>
      </aside>
    </div>
  );
}
