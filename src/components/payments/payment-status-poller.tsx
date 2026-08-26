"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_POLL_MS = 5_000;
const MAX_POLL_MS = 20_000;
const TIMEOUT_MS = 180_000;
const TERMINAL = new Set(["PAID", "FAILED", "CANCELLED", "SUCCESS"]);

export function PaymentStatusPoller({
  apiRef,
  initialStatus,
}: {
  apiRef: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(
    "Check your phone for the M-Pesa prompt and enter your PIN.",
  );
  const [timedOut, setTimedOut] = useState(false);
  const [round, setRound] = useState(0);
  const startedAt = useRef(Date.now());
  const inFlight = useRef(false);
  const stopped = useRef(false);
  const delayMs = useRef(INITIAL_POLL_MS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (TERMINAL.has(initialStatus)) {
      return;
    }

    stopped.current = false;
    startedAt.current = Date.now();
    delayMs.current = INITIAL_POLL_MS;

    const clearTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    const schedule = (ms: number) => {
      clearTimer();
      if (stopped.current) return;
      timer.current = setTimeout(() => {
        void tick();
      }, ms);
    };

    const stop = () => {
      stopped.current = true;
      clearTimer();
    };

    const tick = async () => {
      if (stopped.current || inFlight.current) return;

      if (Date.now() - startedAt.current > TIMEOUT_MS) {
        setTimedOut(true);
        setMessage(
          "We have not confirmed this payment yet. If you completed M-Pesa, wait a moment and refresh. If you cancelled, you can try again.",
        );
        stop();
        return;
      }

      inFlight.current = true;
      try {
        const response = await fetch(`/api/payments/status?ref=${encodeURIComponent(apiRef)}`, {
          cache: "no-store",
        });

        if (response.status === 429) {
          const retryAfterHeader = Number(response.headers.get("Retry-After") ?? "0");
          let retryAfterMs = retryAfterHeader > 0 ? retryAfterHeader * 1000 : delayMs.current * 2;
          try {
            const body = (await response.json()) as { retryAfterMs?: number; nextPollMs?: number };
            retryAfterMs = body.retryAfterMs ?? body.nextPollMs ?? retryAfterMs;
          } catch {
            // ignore body parse errors on 429
          }
          delayMs.current = Math.min(MAX_POLL_MS, Math.max(retryAfterMs, delayMs.current));
          setMessage("Confirming with M-Pesa… please wait.");
          schedule(delayMs.current);
          return;
        }

        if (!response.ok) {
          delayMs.current = Math.min(MAX_POLL_MS, delayMs.current + 3_000);
          schedule(delayMs.current);
          return;
        }

        const data = (await response.json()) as {
          status?: string;
          state?: string;
          terminal?: boolean;
          nextPollMs?: number;
          retryAfterMs?: number | null;
        };

        const status = data.state ?? data.status ?? "";
        if (data.terminal || TERMINAL.has(status)) {
          stop();
          router.refresh();
          return;
        }

        setMessage("Check your phone for the M-Pesa prompt and enter your PIN.");
        const suggested = data.retryAfterMs ?? data.nextPollMs ?? delayMs.current;
        delayMs.current = Math.min(MAX_POLL_MS, Math.max(INITIAL_POLL_MS, suggested));
        // Mild backoff so we do not hammer Daraja via the status route.
        delayMs.current = Math.min(MAX_POLL_MS, delayMs.current + 1_000);
        schedule(delayMs.current);
      } catch {
        delayMs.current = Math.min(MAX_POLL_MS, delayMs.current + 2_000);
        schedule(delayMs.current);
      } finally {
        inFlight.current = false;
      }
    };

    // First poll after a short wait so the Daraja callback can arrive first.
    schedule(INITIAL_POLL_MS);

    return () => {
      stop();
    };
  }, [apiRef, initialStatus, router, round]);

  return (
    <div className="mt-4 space-y-2 text-sm text-muted">
      <p>{message}</p>
      {!timedOut ? (
        <p className="text-xs">
          Waiting for M-Pesa confirmation… Votes/tickets are added only after payment succeeds.
        </p>
      ) : (
        <button
          type="button"
          className="font-semibold text-navy"
          onClick={() => {
            setTimedOut(false);
            startedAt.current = Date.now();
            delayMs.current = INITIAL_POLL_MS;
            stopped.current = false;
            setRound((n) => n + 1);
            router.refresh();
          }}
        >
          Check again
        </button>
      )}
    </div>
  );
}
