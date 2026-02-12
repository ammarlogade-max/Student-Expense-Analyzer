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
