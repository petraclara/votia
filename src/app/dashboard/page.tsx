import { format } from "date-fns";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard/charts";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, organizer } = await requireOrganizer();
  const organizerFilter = user.role === "ADMIN" ? {} : { organizerId: organizer!.id };

  const [events, votes, ticketAgg, contestantCount, topContestants] = await Promise.all([
    prisma.event.findMany({ where: organizerFilter }),
    prisma.voteTransaction.findMany({
      where: { status: "PAID", processed: true, event: organizerFilter },
      include: { contestant: true, event: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticketOrder.aggregate({
      where: { status: "PAID", processed: true, event: organizerFilter },
      _sum: { quantity: true },
    }),
    prisma.contestant.count({ where: { event: organizerFilter } }),
    prisma.contestant.findMany({
      where: { event: organizerFilter },
      orderBy: { voteCount: "desc" },
      take: 8,
    }),
  ]);

  const totalVotes = votes.reduce((sum, item) => sum + item.voteQuantity, 0);
  const ticketsSold = ticketAgg._sum.quantity ?? 0;
  const activeEvents = events.filter((event) => event.status === "LIVE" || event.status === "UPCOMING").length;

  const votesByDay = () => {
    const map = new Map<string, number>();
    for (const item of votes) {
      const day = format(item.createdAt, "dd MMM");
      map.set(day, (map.get(day) ?? 0) + item.voteQuantity);
    }
    return Array.from(map.entries()).map(([date, value]) => ({ date, votes: value }));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-navy">Overview</h1>
          <p className="text-sm text-muted">
            {organizer?.status === "PENDING"
              ? "Your organizer account is awaiting approval. You cannot create events until an admin approves you."
              : organizer?.status === "SUSPENDED"
                ? "Your organizer account is suspended."
                : "Track events, contestants and votes."}
          </p>
        </div>
        {organizer?.status === "APPROVED" || user.role === "ADMIN" ? (
          <ButtonLink href="/dashboard/events/new">Create event</ButtonLink>
        ) : (
          <span className="rounded-full bg-bg px-4 py-2 text-sm font-semibold text-muted">
            Create event locked
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Votes" value={totalVotes.toLocaleString()} />
        <Stat label="Total Contestants" value={String(contestantCount)} />
        <Stat label="Active Events" value={String(activeEvents)} />
        <Stat label="Tickets Sold" value={String(ticketsSold)} />
      </div>

      <div className="mt-8">
        <DashboardCharts
          votes={votesByDay()}
          topContestants={topContestants.map((item) => ({
            name: item.name.split(" ")[0],
            votes: item.voteCount,
          }))}
        />
      </div>

      <section className="mt-8 rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold text-navy">Recent votes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-2">Contestant</th>
                <th>Votes</th>
                <th>Event</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {votes.slice(0, 8).map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="py-2">{item.contestant.name}</td>
                  <td>{item.voteQuantity}</td>
                  <td>{item.event.name}</td>
                  <td>{format(item.createdAt, "dd MMM HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/dashboard/transactions" className="mt-4 inline-block text-sm font-semibold text-navy">
          View all votes
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
