"use client";

import { useState, useTransition } from "react";
import type { Event, Ticket } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/utils";

export function TicketPurchase({
  event,
  tickets,
}: {
  event: Event;
  tickets: Ticket[];
}) {
  const [ticketId, setTicketId] = useState(tickets[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = tickets.find((ticket) => ticket.id === ticketId);
  const remaining = selected ? selected.quantity - selected.sold : 0;
  const total = selected ? selected.price * quantity : 0;

  function pay() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/payments/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketId,
          quantity,
          customerName,
          customerPhone,
          customerEmail,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to start payment.");
        return;
      }
      window.location.href = data.checkoutUrl;
    });
  }

  if (!tickets.length) {
    return <p className="text-sm text-muted">Tickets are not available for this event yet.</p>;
  }

  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-[var(--shadow)]">
      <h3 className="text-xl font-semibold text-navy">Buy tickets</h3>
      <div className="mt-4 grid gap-2">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => setTicketId(ticket.id)}
            className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left ${
              ticketId === ticket.id ? "border-teal bg-teal-soft" : "border-border"
            }`}
          >
            <span className="font-semibold text-navy">{ticket.name}</span>
            <span className="text-sm text-muted">
              {formatKes(ticket.price)} · {ticket.quantity - ticket.sold} left
            </span>
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-semibold">
        Quantity
        <input
          type="number"
          min={1}
          max={Math.min(20, remaining)}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="mt-1 h-12 w-full rounded-2xl border border-border px-4"
        />
      </label>
      <div className="mt-3 grid gap-3">
        <input
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Full name"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          required
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Phone"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          required
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="h-12 rounded-2xl border border-border px-4"
        />
      </div>
      <p className="mt-4 text-lg font-semibold text-navy">Total {formatKes(total)}</p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <Button className="mt-4 w-full" size="lg" onClick={pay} disabled={pending || remaining < 1}>
        {pending ? "Starting payment..." : `Pay ${formatKes(total)}`}
      </Button>
    </div>
  );
}
