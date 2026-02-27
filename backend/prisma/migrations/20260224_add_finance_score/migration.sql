-- Migration: add_finance_score
-- Run after updating schema.prisma

CREATE TABLE "FinanceScore" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "date"             TIMESTAMP(3) NOT NULL,
  "totalScore"       INTEGER NOT NULL,
  "level"            TEXT NOT NULL,
  "consistencyScore" INTEGER NOT NULL,
  "budgetScore"      INTEGER NOT NULL,
  "cashScore"        INTEGER NOT NULL,
  "savingsScore"     INTEGER NOT NULL,
  "streak"           INTEGER NOT NULL,
  "weeklyDelta"      INTEGER NOT NULL,
  "insight"          TEXT NOT NULL,
  CONSTRAINT "FinanceScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinanceScore_userId_date_key" ON "FinanceScore"("userId", "date");
CREATE INDEX "FinanceScore_userId_date_idx" ON "FinanceScore"("userId", "date");

ALTER TABLE "FinanceScore"
  ADD CONSTRAINT "FinanceScore_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
