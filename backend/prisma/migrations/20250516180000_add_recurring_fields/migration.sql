-- Add isRecurring and recurringFrequency to Transaction table
ALTER TABLE "Transaction"
ADD COLUMN "isRecurring" BOOLEAN DEFAULT FALSE,
ADD COLUMN "recurringFrequency" VARCHAR(16);
