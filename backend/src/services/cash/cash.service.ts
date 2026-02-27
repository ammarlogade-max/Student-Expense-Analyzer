import prisma from "../../config/prisma";
import { predictMerchantCategory } from "../ml/ml.service";

const LOW_CASH_ALERT_THRESHOLD = 200;
type CashTransactionType = "withdrawal" | "expense" | "adjustment";
type CashTransactionSource = "sms" | "manual" | "voice";
const cashDb = prisma as any;

export async function ensureCashWallet(userId: string) {
  return cashDb.cashWallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 }
  });
}

export async function getCashWalletOverview(userId: string, limit = 10) {
  const wallet = await ensureCashWallet(userId);
  const transactions = await cashDb.cashTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  const alerts = await cashDb.cashAlert.findMany({
    where: { userId, isResolved: false },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return {
    wallet,
    lowCash: wallet.balance < LOW_CASH_ALERT_THRESHOLD,
    lowCashThreshold: LOW_CASH_ALERT_THRESHOLD,
    transactions,
    alerts
  };
}

export async function addCashWithdrawal(
  userId: string,
  amount: number,
  source: CashTransactionSource = "manual",
  note = "Cash withdrawal"
) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.cashWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount }
    });

    const transaction = await tx.cashTransaction.create({
      data: {
        userId,
        amount,
        type: "withdrawal",
        category: "Cash Withdrawal",
        source,
        note
      }
    });

    return { wallet, transaction };
  });
}

export async function addCashExpense(data: {
  userId: string;
  amount: number;
  category: string;
  description?: string;
  source?: CashTransactionSource;
}) {
  const source = data.source || "manual";

  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.cashWallet.findUnique({
      where: { userId: data.userId }
    });
    const currentBalance = existing?.balance || 0;
    const nextBalance = currentBalance - data.amount;

    const wallet = await tx.cashWallet.upsert({
      where: { userId: data.userId },
      update: { balance: nextBalance },
      create: { userId: data.userId, balance: nextBalance }
    });

    const cashTxn = await tx.cashTransaction.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        type: "expense",
        category: data.category,
        source,
        note: data.description
      }
    });

    const expense = await tx.expense.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        category: data.category,
        description: data.description || "Cash expense"
      }
    });

    return {
      wallet,
      cashTransaction: cashTxn,
      expense
    };
  });
}

export async function adjustCashWallet(
  userId: string,
  amount: number,
  note?: string
) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.cashWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount }
    });

    const transaction = await tx.cashTransaction.create({
      data: {
        userId,
        amount: Math.abs(amount),
        type: "adjustment",
        category: "Adjustment",
        source: "manual",
        note: note || `Balance adjustment (${amount >= 0 ? "+" : "-"})`
      }
    });

    return { wallet, transaction };
  });
}

export async function getCashTransactions(
  userId: string,
  type?: CashTransactionType,
  limit = 30
) {
  return cashDb.cashTransaction.findMany({
    where: {
      userId,
      ...(type ? { type } : {})
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function calculateWeeklyReconciliation(
  userId: string,
  windowDays = 7
) {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const txns: Array<{ amount: number; type: CashTransactionType }> =
    await cashDb.cashTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      type: { in: ["withdrawal", "expense"] }
    }
  });

  const withdrawals = txns
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = txns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const gap = Math.max(0, withdrawals - expenses);

  return {
    withdrawals,
    expenses,
    gap,
    since
  };
}

export async function createReconciliationAlert(
  userId: string,
  gap: number
) {
  const message =
    `You withdrew Rs. ${gap.toFixed(2)} more than logged cash expenses this week. ` +
    "Categorize remaining cash spending.";

  return cashDb.cashAlert.create({
    data: {
      userId,
      message,
      gapAmount: gap
    }
  });
}

export async function runWeeklyReconciliation(threshold = 200) {
  const users = await prisma.user.findMany({
    select: { id: true }
  });
  const created: Array<{ userId: string; gap: number }> = [];

  for (const user of users) {
    const summary = await calculateWeeklyReconciliation(user.id, 7);
    if (summary.gap > threshold) {
      await createReconciliationAlert(user.id, summary.gap);
      created.push({ userId: user.id, gap: summary.gap });
    }
  }

  return created;
}

export function detectCashWithdrawalSms(smsText: string): {
  isCashWithdrawal: boolean;
  amount: number | null;
} {
  const normalized = smsText.toLowerCase();
  const hasDebitWord = /\bdebit(?:ed)?\b/.test(normalized);
  const hasCashSignal =
    /\batm\b/.test(normalized) ||
    /\bcash\b/.test(normalized) ||
    /\bwdl\b/.test(normalized) ||
    /\bwithdraw(?:al|n)?\b/.test(normalized);

  const amountMatch = normalized.match(
    /(?:rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/
  );
  const amount = amountMatch ? Number(amountMatch[1]) : null;

  return {
    isCashWithdrawal: hasDebitWord && hasCashSignal && Boolean(amount),
    amount
  };
}

export function parseVoiceCashExpense(transcript: string): {
  amount: number | null;
  category: string | null;
  description: string | null;
} {
  const normalized = transcript.toLowerCase().trim();
  const match = normalized.match(
    /\b(?:spent|pay|paid)\s+(\d+(?:\.\d{1,2})?)\s+(?:on|for)\s+(.+)$/
  );

  if (!match) {
    return {
      amount: null,
      category: null,
      description: null
    };
  }

  const amount = Number(match[1]);
  const description = match[2].trim();
  const category = inferCashCategory(description);

  return {
    amount,
    category,
    description
  };
}

export async function parseVoiceCashExpenseSmart(transcript: string): Promise<{
  amount: number | null;
  category: string | null;
  description: string | null;
}> {
  const normalized = transcript.toLowerCase().trim();
  const directPattern =
    /\b(?:spend|spent|pay|paid|add)\s+(\d+(?:\.\d{1,2})?)\s+(?:on|for|in|to)\s+(.+)$/;
  const amountFirstPattern =
    /\b(\d+(?:\.\d{1,2})?)\s+(?:on|for|in|to)\s+(.+)$/;
  const amountOnlyPattern = /\b(?:spend|spent|pay|paid|add)\s+(\d+(?:\.\d{1,2})?)\b/;

  let amount: number | null = null;
  let description: string | null = null;

  const directMatch = normalized.match(directPattern);
  if (directMatch) {
    amount = Number(directMatch[1]);
    description = directMatch[2].trim();
  }

  if (!amount || !description) {
    const amountFirstMatch = normalized.match(amountFirstPattern);
    if (amountFirstMatch) {
      amount = Number(amountFirstMatch[1]);
      description = amountFirstMatch[2].trim();
    }
  }

  if (!amount) {
    const amountOnlyMatch = normalized.match(amountOnlyPattern);
    if (amountOnlyMatch) {
      amount = Number(amountOnlyMatch[1]);
    }
  }

  if (!amount) {
    return {
      amount: null,
      category: null,
      description: null
    };
  }

  const finalDescription = description || transcript.trim();
  let category = inferCashCategory(finalDescription);

  // Fallback to ML merchant/category inference for natural voice phrasing.
  if (category === "Other") {
    try {
      const mlResult = await predictMerchantCategory(finalDescription);
      if (mlResult?.category && mlResult.category !== "Uncategorized") {
        category = mlResult.category;
      }
    } catch {
      // Keep heuristic category if ML inference is unavailable.
    }
  }

  return {
    amount,
    category,
    description: finalDescription
  };
}

function inferCashCategory(text: string): string {
  const value = text.toLowerCase();
  const rules: Array<{ test: RegExp; category: string }> = [
    {
      test: /(food|snack|meal|tea|coffee|restaurant|pizza|burger|zomato|swiggy)/,
      category: "Food"
    },
    { test: /(bus|metro|auto|cab|taxi|fuel|petrol)/, category: "Transport" },
    { test: /(doctor|medicine|pharmacy|clinic|hospital)/, category: "Health" },
    { test: /(movie|cinema|game|netflix|party)/, category: "Entertainment" },
    { test: /(book|course|tuition|college|school)/, category: "Education" },
    { test: /(shopping|flipkart|amazon|myntra|store)/, category: "Shopping" }
  ];

  const found = rules.find((r) => r.test.test(value));
  return found?.category || "Other";
}
