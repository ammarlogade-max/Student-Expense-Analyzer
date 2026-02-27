export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description?: string | null;
  createdAt: string;
};

export type MonthlySummary = {
  total: number;
  byCategory: Record<string, number>;
};

export type CashTransaction = {
  id: string;
  amount: number;
  type: "withdrawal" | "expense" | "adjustment";
  category?: string | null;
  source: "sms" | "manual" | "voice";
  note?: string | null;
  createdAt: string;
};

export type CashWallet = {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type CashAlert = {
  id: string;
  message: string;
  gapAmount: number;
  isResolved: boolean;
  createdAt: string;
};
