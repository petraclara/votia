import { NextResponse } from "next/server";
import {
  fulfillPaymentByApiRef,
  getPaymentStatusByApiRef,
} from "@/lib/payments/fulfill";
import { isDarajaConfigured } from "@/lib/payments/daraja";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
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
    nextPollMs: status.terminal
      ? 0
      : Math.max(status.nextPollMs, retryAfterMs ?? 0, 5_000),
  };

  if (darajaRateLimited && !status.terminal) {
    return NextResponse.json(payload, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 45_000) / 1000)) },
    });
  }

  return NextResponse.json(payload);
}
