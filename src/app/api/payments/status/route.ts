import { NextResponse } from "next/server";
import {
  fulfillPaymentByApiRef,
  getPaymentStatusByApiRef,
} from "@/lib/payments/fulfill";
import { isDarajaConfigured } from "@/lib/payments/daraja";
import { nextPaymentPollMs } from "@/lib/payments/daraja-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
  }
  if (!/^(vote|ticket)_[a-zA-Z0-9-]+$/.test(ref)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  // Read DB first — never hit Daraja when already terminal.
  let status = await getPaymentStatusByApiRef(ref);
  if (!status) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (status.terminal) {
    return NextResponse.json(status);
  }

  let retryAfterMs: number | null = null;
  let darajaRateLimited = false;
  if (isDarajaConfigured()) {
    const reconcile = await fulfillPaymentByApiRef(ref).catch((error) => {
      console.error("Payment status reconcile failed", {
        ref,
        error: error instanceof Error ? error.message : "unknown",
      });
      return null;
    });

    if (reconcile?.rateLimited || reconcile?.reason === "rate_limited") {
      darajaRateLimited = true;
      retryAfterMs = reconcile.retryAfterMs ?? 45_000;
    } else if (reconcile?.retryAfterMs) {
      retryAfterMs = reconcile.retryAfterMs;
    }

    status = (await getPaymentStatusByApiRef(ref)) ?? status;
  }

  const payload = {
    ...status,
    retryAfterMs,
    nextPollMs: nextPaymentPollMs({
      terminal: status.terminal,
      retryAfterMs,
      queryIntervalMs: status.nextPollMs,
      minMs: 5_000,
    }),
  };

  if (darajaRateLimited && !status.terminal) {
    return NextResponse.json(payload, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 45_000) / 1000)) },
    });
  }

  return NextResponse.json(payload);
}
