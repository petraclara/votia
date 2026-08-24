-- AlterTable
ALTER TABLE "VoteTransaction" ADD COLUMN "processingFee" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TicketOrder" ADD COLUMN "processingFee" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PARTIALLY_SETTLED', 'SETTLED', 'DISPUTED');

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "processingFees" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "organizerAmount" INTEGER NOT NULL,
    "payoutFee" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "settlementReference" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Settlement_organizerId_status_idx" ON "Settlement"("organizerId", "status");

-- CreateIndex
CREATE INDEX "Settlement_eventId_idx" ON "Settlement"("eventId");

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
