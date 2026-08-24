import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardTicketsPage() {
  const { user, organizer } = await requireOrganizer();
  const orders = await prisma.ticketOrder.findMany({
    where: { event: user.role === "ADMIN" ? {} : { organizerId: organizer!.id } },
    include: { ticket: true, event: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold text-navy">Ticket purchases</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Event</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2">{item.event.name}</td>
                <td>{item.ticket.name}</td>
                <td>{item.quantity}</td>
                <td>{formatKes(item.amount)}</td>
                <td>{item.customerName}</td>
                <td>{item.status}</td>
                <td>{format(item.createdAt, "dd MMM yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
