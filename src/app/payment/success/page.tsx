import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fulfillPaymentByApiRef } from "@/lib/payments/fulfill";
import { formatKes } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { ShareButtons } from "@/components/events/share-buttons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payment status",
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) {
    return (
      <div className="container-px py-16 text-center">
        <h1 className="text-3xl font-semibold text-navy">Payment received</h1>
        <p className="mt-3 text-muted">Missing payment reference.</p>
      </div>
    );
  }

  if (process.env.INTASEND_PUBLIC_KEY && process.env.INTASEND_SECRET_KEY) {
    await fulfillPaymentByApiRef(ref).catch(() => null);
  }

  if (ref.startsWith("vote_")) {
    const transaction = await prisma.voteTransaction.findUnique({
      where: { apiRef: ref },
      include: { contestant: true, event: true },
    });
    if (!transaction) {
      return <StatusCard title="Payment not found" body="We could not match this payment reference." />;
    }
    if (transaction.status === "FAILED" || transaction.status === "CANCELLED") {
      return (
        <StatusCard
          title="Payment did not complete"
          body="No votes were added. You can return to the contestant and try again."
          extra={
            <ButtonLink href={`/events/${transaction.event.slug}/contestants/${transaction.contestant.slug}`}>
              Try again
            </ButtonLink>
          }
        />
      );
    }
    if (transaction.status === "PAID" && transaction.processed) {
      return (
        <div className="container-px py-12">
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-[var(--shadow)]">
            <h1 className="text-3xl font-semibold text-navy">Vote Successful 🎉</h1>
            <p className="mt-3 text-muted">
              Thank you for supporting {transaction.contestant.name}.
            </p>
            <p className="mt-2 font-semibold text-navy">
              {transaction.voteQuantity} votes have been added successfully.
            </p>
            <dl className="mt-6 space-y-2 text-left text-sm">
              <Row label="Contestant" value={transaction.contestant.name} />
              <Row label="Votes purchased" value={String(transaction.voteQuantity)} />
              <Row label="Amount paid" value={formatKes(transaction.amount)} />
              <Row label="Payment reference" value={transaction.intasendReference ?? transaction.apiRef} />
              <Row label="Event" value={transaction.event.name} />
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={`/events/${transaction.event.slug}/contestants/${transaction.contestant.slug}`}>
                Vote Again
              </ButtonLink>
              <ButtonLink href={`/events/${transaction.event.slug}`} variant="secondary">
                View Event
              </ButtonLink>
            </div>
            <div className="mt-6">
              <ShareButtons
                name={transaction.contestant.name}
                eventName={transaction.event.name}
                path={`/events/${transaction.event.slug}/contestants/${transaction.contestant.slug}`}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <StatusCard
        title="Confirming your payment"
        body="IntaSend is verifying this transaction. Votes are added only after the payment is confirmed. Refresh this page in a moment."
        extra={
          <Link href={`/payment/success?ref=${ref}`} className="font-semibold text-navy">
            Refresh status
          </Link>
        }
      />
    );
  }

  const order = await prisma.ticketOrder.findUnique({
    where: { apiRef: ref },
    include: { ticket: true, event: true },
  });
  if (!order) {
    return <StatusCard title="Payment not found" body="We could not match this payment reference." />;
  }
  if (order.status === "FAILED" || order.status === "CANCELLED") {
    return (
      <StatusCard
        title="Payment did not complete"
        body="No tickets were issued. You can return to the event and try again."
      />
    );
  }
  if (order.status === "PAID" && order.processed) {
    return (
      <div className="container-px py-12">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-[var(--shadow)]">
          <h1 className="text-3xl font-semibold text-navy">Ticket purchase confirmed</h1>
          <p className="mt-3 text-muted">
            {order.quantity} × {order.ticket.name} for {order.event.name}.
          </p>
          <dl className="mt-6 space-y-2 text-left text-sm">
            <Row label="Amount paid" value={formatKes(order.amount)} />
            <Row label="Payment reference" value={order.intasendReference ?? order.apiRef} />
          </dl>
          <ButtonLink href={`/events/${order.event.slug}`} className="mt-6">
            View Event
          </ButtonLink>
        </div>
      </div>
    );
  }
  return (
    <StatusCard
      title="Confirming your ticket payment"
      body="Tickets are issued only after IntaSend confirms the payment."
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}

function StatusCard({
  title,
  body,
  extra,
}: {
  title: string;
  body: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="container-px py-16">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-[var(--shadow)]">
        <h1 className="text-3xl font-semibold text-navy">{title}</h1>
        <p className="mt-3 text-muted">{body}</p>
        {extra ? <div className="mt-4">{extra}</div> : null}
      </div>
    </div>
  );
}
