import { notFound } from "next/navigation";
import { deleteTicketAction, upsertTicketAction } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, organizer } = await requireOrganizer();
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tickets: true, ticketOrders: { where: { status: "PAID" }, include: { ticket: true } } },
  });
  if (!event) notFound();
  if (user.role !== "ADMIN" && event.organizerId !== organizer?.id) notFound();

  async function addTicket(formData: FormData) {
    "use server";
    await upsertTicketAction(id, formData);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-navy">Tickets · {event.name}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={addTicket} className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <h2 className="font-semibold text-navy">Create ticket category</h2>
          <div className="mt-4 grid gap-3">
            <input name="name" required placeholder="Regular / VIP / VVIP" className="h-12 rounded-2xl border border-border px-4" />
            <input name="price" type="number" required placeholder="Price" className="h-12 rounded-2xl border border-border px-4" />
            <input name="quantity" type="number" required placeholder="Quantity" className="h-12 rounded-2xl border border-border px-4" />
            <Button type="submit">Save ticket</Button>
          </div>
        </form>
        <div className="space-y-3">
          {event.tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
              <p className="font-semibold text-navy">
                {ticket.name} · {formatKes(ticket.price)}
              </p>
              <p className="text-sm text-muted">
                {ticket.sold} sold / {ticket.quantity}
              </p>
              <form
                action={async () => {
                  "use server";
                  await deleteTicketAction(id, ticket.id);
                }}
              >
                <button type="submit" className="mt-2 text-sm font-semibold text-danger">
                  Remove
                </button>
              </form>
            </div>
          ))}
          <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
            <h3 className="font-semibold text-navy">Recent purchases</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {event.ticketOrders.slice(0, 8).map((order) => (
                <li key={order.id}>
                  {order.customerName} · {order.quantity} × {order.ticket.name} · {formatKes(order.amount)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
