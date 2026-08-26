-- Rename IntaSend columns to Daraja / M-Pesa fields
ALTER TABLE "VoteTransaction" RENAME COLUMN "intasendInvoiceId" TO "mpesaCheckoutRequestId";
ALTER TABLE "VoteTransaction" RENAME COLUMN "intasendReference" TO "mpesaReceiptNumber";
ALTER INDEX "VoteTransaction_intasendReference_key" RENAME TO "VoteTransaction_mpesaReceiptNumber_key";

ALTER TABLE "TicketOrder" RENAME COLUMN "intasendInvoiceId" TO "mpesaCheckoutRequestId";
ALTER TABLE "TicketOrder" RENAME COLUMN "intasendReference" TO "mpesaReceiptNumber";
ALTER INDEX "TicketOrder_intasendReference_key" RENAME TO "TicketOrder_mpesaReceiptNumber_key";

CREATE INDEX "VoteTransaction_mpesaCheckoutRequestId_idx" ON "VoteTransaction"("mpesaCheckoutRequestId");
CREATE INDEX "TicketOrder_mpesaCheckoutRequestId_idx" ON "TicketOrder"("mpesaCheckoutRequestId");
