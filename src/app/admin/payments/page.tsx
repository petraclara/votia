import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getEventLedger } from "@/lib/finance";
import { formatKes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { organizer: true },
  });
  const ledgers = (
    await Promise.all(events.map((event) => getEventLedger(event.id)))
  ).filter((item) => item && item.gross > 0);

  const totals = ledgers.reduce(
    (acc, item) => {
      if (!item) return acc;
      acc.gross += item.gross;
      acc.processingFees += item.processingFees;
      acc.platformFee += item.platformFee;
      acc.organizerAmount += item.organizerAmount;
      acc.outstanding += item.outstanding;
      return acc;
    },
    { gross: 0, processingFees: 0, platformFee: 0, organizerAmount: 0, outstanding: 0 },
  );

  return (
    <div className="container-px py-10">
      <h1 className="text-3xl font-semibold text-navy">Payment reconciliation</h1>
      <p className="mt-2 text-sm text-muted">
        Gross collections are not platform revenue. Platform fee is a share of gross after
        recorded processing fees.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Gross collections" value={formatKes(totals.gross)} />
        <Stat label="Processing fees" value={formatKes(totals.processingFees)} />
        <Stat label="Platform fee" value={formatKes(totals.platformFee)} />
        <Stat label="Organizer amount due" value={formatKes(totals.organizerAmount)} />
        <Stat label="Outstanding" value={formatKes(totals.outstanding)} />
      </div>
      <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Event</th>
              <th>Organizer</th>
              <th>Gross</th>
              <th>Processing</th>
              <th>Platform</th>
              <th>Due</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ledgers.map((item) =>
              item ? (
                <tr key={item.event.id} className="border-t border-border">
                  <td className="py-2">{item.event.name}</td>
                  <td>{item.event.organizer.organizationName}</td>
                  <td>{formatKes(item.gross)}</td>
                  <td>{formatKes(item.processingFees)}</td>
                  <td>{formatKes(item.platformFee)}</td>
                  <td>{formatKes(item.organizerAmount)}</td>
                  <td>{formatKes(item.outstanding)}</td>
                  <td>{item.status}</td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-navy">{value}</p>
    </div>
  );
}
