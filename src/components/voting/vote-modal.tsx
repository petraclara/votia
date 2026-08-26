"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { Contestant, Event } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { formatKes, padContestantNumber } from "@/lib/utils";
import { votePacks } from "@/lib/site";

export function VoteModal({
  contestant,
  event,
  onClose,
}: {
  contestant: Contestant;
  event: Event;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white pb-8 md:max-w-lg md:rounded-3xl md:pb-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="vote-title" className="text-lg font-semibold text-navy">
            Cast your votes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-bg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <VoteForm contestant={contestant} event={event} />
        </div>
      </div>
    </div>
  );
}

export function VoteForm({ contestant, event }: { contestant: Contestant; event: Event }) {
  const [votes, setVotes] = useState(10);
  const [custom, setCustom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const quantity = useMemo(() => {
    const fromCustom = Number(custom);
    if (custom && Number.isInteger(fromCustom) && fromCustom > 0) return fromCustom;
    return votes;
  }, [custom, votes]);

  const total = quantity * event.votePrice;

  function pay() {
    setError(null);
    if (!phone.trim()) {
      setError("Enter your M-Pesa phone number.");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/payments/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestantId: contestant.id,
          eventId: event.id,
          voteQuantity: quantity,
          customerEmail: email,
          customerPhone: phone,
          customerName: name,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to start payment.");
        return;
      }
      window.location.href = `/payment/success?ref=${encodeURIComponent(data.apiRef)}`;
    });
  }

  return (
    <div>
      <div className="flex gap-4">
        <div className="relative h-24 w-20 overflow-hidden rounded-2xl bg-navy">
          <Image src={contestant.image} alt={contestant.name} fill className="object-cover" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-dark">
            Contestant #{padContestantNumber(contestant.contestantNumber)}
          </p>
          <h3 className="text-xl font-semibold text-navy">{contestant.name}</h3>
          <p className="text-sm text-muted">{event.name}</p>
        </div>
      </div>

      <h4 className="mt-6 text-sm font-bold uppercase tracking-wider text-navy">
        Choose number of votes
      </h4>
      <p className="mt-1 text-sm text-muted">1 Vote = {formatKes(event.votePrice)}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {votePacks.map((pack) => (
          <button
            key={pack}
            type="button"
            onClick={() => {
              setVotes(pack);
              setCustom("");
            }}
            className={`min-h-14 rounded-2xl border px-3 py-2 text-left text-sm font-semibold ${
              !custom && votes === pack
                ? "border-teal bg-teal-soft text-navy"
                : "border-border bg-white text-ink"
            }`}
          >
            {pack} Vote{pack === 1 ? "" : "s"}
            <span className="mt-0.5 block text-xs font-medium text-muted">
              {formatKes(pack * event.votePrice)}
            </span>
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-semibold text-navy">
        Custom number of votes
        <input
          type="number"
          min={1}
          max={10000}
          value={custom}
          onChange={(eventValue) => setCustom(eventValue.target.value)}
          placeholder="Enter votes"
          className="mt-1 h-12 w-full rounded-2xl border border-border px-4"
        />
      </label>

      <div className="mt-5 rounded-2xl bg-bg p-4 text-sm">
        <p className="flex justify-between">
          <span>Votes</span>
          <strong>{quantity}</strong>
        </p>
        <p className="mt-1 flex justify-between">
          <span>Price per vote</span>
          <strong>{formatKes(event.votePrice)}</strong>
        </p>
        <p className="mt-2 flex justify-between border-t border-border pt-2 text-base">
          <span>Total</span>
          <strong>{formatKes(total)}</strong>
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="M-Pesa phone (required)"
          required
          inputMode="tel"
          autoComplete="tel"
          className="h-12 rounded-2xl border border-border px-4"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          type="email"
          className="h-12 rounded-2xl border border-border px-4"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <Button className="mt-5 w-full" size="lg" onClick={pay} disabled={pending || quantity < 1}>
        {pending ? "Sending M-Pesa prompt..." : `Pay ${formatKes(total)}`}
      </Button>
      <p className="mt-3 text-center text-xs text-muted">
        You will get an M-Pesa STK prompt on your phone. Votes are added only after payment is confirmed.
      </p>
    </div>
  );
}
