import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { recordSettlementAction } from "@/app/actions/admin";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
  await requireAdmin();
  const [events, settlements] = await Promise.all([
    prisma.event.findMany({
      orderBy: { name: "asc" },
      include: { organizer: true },
    }),
    prisma.settlement.findMany({
      include: { event: true, organizer: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="container-px py-10">
      <h1 className="text-3xl font-semibold text-navy">Settlements</h1>
      <p className="mt-2 text-sm text-muted">
        Record manual payouts. Do not send money automatically from this screen.
      </p>
      <form action={recordSettlementAction} className="mt-6 grid gap-3 rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <select name="eventId" required className="h-12 rounded-2xl border border-border px-4">
          <option value="">Select event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} · {event.organizer.organizationName}
            </option>
          ))}
        </select>
        <input
          name="amountPaid"
          type="number"
          min={0}
          required
          placeholder="Amount paid to organizer (KES)"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          name="paymentMethod"
          placeholder="Payment method e.g. bank transfer"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          name="settlementReference"
          required
          placeholder="Payout reference"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="disputed" />
          Mark as disputed
        </label>
        <Button type="submit">Record payout</Button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Date</th>
              <th>Event</th>
              <th>Organizer</th>
              <th>Paid</th>
              <th>Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2">{format(item.createdAt, "dd MMM yyyy")}</td>
                <td>{item.event.name}</td>
                <td>{item.organizer.organizationName}</td>
                <td>{formatKes(item.amountPaid)}</td>
                <td>{item.settlementReference}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
