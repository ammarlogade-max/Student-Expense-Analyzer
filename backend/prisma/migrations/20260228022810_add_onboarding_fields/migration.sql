-- AlterTable
ALTER TABLE "User" ADD COLUMN     "budgetSplit" JSONB,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "college" TEXT,
ADD COLUMN     "monthlyAllowance" DOUBLE PRECISION,
ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "yearOfStudy" INTEGER;
