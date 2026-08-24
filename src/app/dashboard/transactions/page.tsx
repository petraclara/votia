import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { user, organizer } = await requireOrganizer();
  const votes = await prisma.voteTransaction.findMany({
    where: {
      status: "PAID",
      processed: true,
      event: user.role === "ADMIN" ? {} : { organizerId: organizer!.id },
    },
    include: { contestant: true, event: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold text-navy">Votes</h1>
      <p className="mt-1 text-sm text-muted">Confirmed votes for your events only.</p>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Event</th>
              <th>Contestant</th>
              <th>Votes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2">{item.event.name}</td>
                <td>{item.contestant.name}</td>
                <td>{item.voteQuantity}</td>
                <td>{format(item.createdAt, "dd MMM yyyy HH:mm")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
