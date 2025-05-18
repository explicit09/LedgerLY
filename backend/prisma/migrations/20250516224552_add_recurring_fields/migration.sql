-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_plaidItemId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "authorizedAccountId" TEXT,
ADD COLUMN     "transactionMetadata" JSONB,
ALTER COLUMN "recurringFrequency" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
