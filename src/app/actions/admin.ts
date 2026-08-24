"use server";

import { revalidatePath } from "next/cache";
import { SettlementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getEventLedger } from "@/lib/finance";
import { settlementStatusFromAmounts } from "@/lib/payments/money";

export async function setOrganizerStatusAction(organizerId: string, status: "PENDING" | "APPROVED" | "SUSPENDED") {
  await requireAdmin();
  await prisma.organizer.update({ where: { id: organizerId }, data: { status } });
  revalidatePath("/admin");
}

export async function disableEventAction(eventId: string) {
  await requireAdmin();
  await prisma.event.update({ where: { id: eventId }, data: { status: "DISABLED" } });
  revalidatePath("/admin");
}

export async function recordSettlementAction(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const amountPaid = Number(formData.get("amountPaid"));
  const paymentMethod = String(formData.get("paymentMethod") ?? "manual");
  const settlementReference = String(formData.get("settlementReference") ?? "").trim();
  const disputed = formData.get("disputed") === "on";

  if (!eventId || !Number.isInteger(amountPaid) || amountPaid < 0 || !settlementReference) {
    throw new Error("Enter a valid payout amount and reference.");
  }

  const ledger = await getEventLedger(eventId);
  if (!ledger) throw new Error("Event not found");

  const status: SettlementStatus = disputed
    ? "DISPUTED"
    : settlementStatusFromAmounts(ledger.organizerAmount, ledger.amountPaid + amountPaid);

  await prisma.settlement.create({
    data: {
      organizerId: ledger.event.organizerId,
      eventId,
      grossAmount: ledger.gross,
      processingFees: ledger.processingFees,
      platformFee: ledger.platformFee,
      organizerAmount: ledger.organizerAmount,
      payoutFee: ledger.payoutFee,
      amountPaid,
      paymentMethod,
      settlementReference,
      status,
      paidAt: amountPaid > 0 ? new Date() : null,
    },
  });

  revalidatePath("/admin/settlements");
  revalidatePath("/admin/payments");
}
