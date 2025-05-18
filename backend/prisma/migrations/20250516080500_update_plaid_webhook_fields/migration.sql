-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "plaidItemId" TEXT,
ADD COLUMN "plaidTransactionId" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "pending" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_plaidItemId_idx" ON "Transaction"("plaidItemId");

-- CreateIndex
CREATE INDEX "Transaction_plaidTransactionId_idx" ON "Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- AlterTable
ALTER TABLE "PlaidItem" ADD COLUMN "lastWebhookReceivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PlaidItem_status_idx" ON "PlaidItem"("status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
