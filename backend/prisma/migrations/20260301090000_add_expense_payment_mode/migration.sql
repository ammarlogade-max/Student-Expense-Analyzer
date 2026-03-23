-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'DIGITAL');

-- AlterTable
ALTER TABLE "Expense"
ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'DIGITAL';
