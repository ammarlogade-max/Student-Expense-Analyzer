-- Add transactedAt to Expense table
-- This stores the ACTUAL date of the transaction (from SMS or entered by user)
-- instead of just createdAt which is when it was logged
ALTER TABLE "Expense" ADD COLUMN "transactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add database indexes for faster queries as data grows
CREATE INDEX IF NOT EXISTS "Expense_userId_createdAt_idx" ON "Expense"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CashTransaction_userId_createdAt_idx" ON "CashTransaction"("userId", "createdAt");

-- Create the Budget table
CREATE TABLE "Budget" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "monthlyLimit"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryBudgets"  JSONB NOT NULL DEFAULT '{}',
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- Each user can only have one budget record
CREATE UNIQUE INDEX "Budget_userId_key" ON "Budget"("userId");

-- Foreign key: budget belongs to a user
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;