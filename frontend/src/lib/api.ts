import type {
  CashAlert,
  CashTransaction,
  CashWallet,
  Expense,
  MonthlySummary,
  User
} from "./types";
import { getToken } from "./storage";

const rawApiBase = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const normalizedApiBase = rawApiBase.replace(/\/+$/, "");
const API_BASE = normalizedApiBase.endsWith("/api")
  ? normalizedApiBase
  : `${normalizedApiBase}/api`;
const BACKEND_OFFLINE_COOLDOWN_MS = 3000;

let backendOfflineUntil = 0;

function publishBackendStatus(online: boolean, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("sea:backend-status", {
      detail: { online, message, at: Date.now() }
    })
  );
}

type RequestOptions = RequestInit & { auth?: boolean };

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };

  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const now = Date.now();
  if (now < backendOfflineUntil) {
    throw new Error(
      "Cannot connect to backend. Start backend server on http://localhost:5000."
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch {
    backendOfflineUntil = Date.now() + BACKEND_OFFLINE_COOLDOWN_MS;
    publishBackendStatus(
      false,
      "Backend offline: start backend server on http://localhost:5000."
    );
    throw new Error(
      "Cannot connect to backend. Start backend server on http://localhost:5000."
    );
  }

  backendOfflineUntil = 0;
  publishBackendStatus(true);

  const isJson =
    res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      data?.message || data?.error || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return request<{ token: string; refreshToken: string; user: User }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    }
  );
}

export async function signup(
  name: string,
  email: string,
  password: string
) {
  return request<{ user: User }>(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }
  );
}

export async function refreshSession(refreshToken: string) {
  return request<{ token: string; refreshToken: string }>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }
  );
}

export async function logout() {
  return request<{ message: string }>("/auth/logout", {
    method: "POST",
    auth: true
  });
}

export async function getMe() {
  return request<{ user: User }>("/auth/me", {
    method: "GET",
    auth: true
  });
}

export async function getExpenses(params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  if (params?.query) search.set("query", params.query);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const path = qs ? `/expenses?${qs}` : "/expenses";

  return request<{
    expenses: Expense[];
    meta: { total: number; page: number; limit: number };
  }>(path, {
    method: "GET",
    auth: true
  });
}

export async function addExpense(
  payload: Pick<Expense, "amount" | "category" | "description">
) {
  return request<{ expense: Expense }>("/expenses", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function updateExpense(
  id: string,
  payload: Partial<Pick<Expense, "amount" | "category" | "description">>
) {
  return request<{ expense: Expense }>(`/expenses/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function deleteExpense(id: string) {
  return request<{ success: boolean }>(`/expenses/${id}`, {
    method: "DELETE",
    auth: true
  });
}

export async function getMonthlySummary() {
  return request<{ summary: MonthlySummary }>(
    "/expenses/summary/monthly",
    {
      method: "GET",
      auth: true
    }
  );
}

export async function predictMerchant(merchant: string) {
  return request<{ result: { merchant: string; category: string } }>(
    "/ml/predict",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ merchant })
    }
  );
}

export async function parseSms(smsText: string) {
  return request<{
    result: {
      amount: string | null;
      date: string | null;
      merchant: string;
      category: string;
      type?: string;
    };
  }>("/ml/parse-sms", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ smsText })
  });
}

export async function ingestSms(smsText: string) {
  return request<{
    result: {
      amount: string | null;
      date: string | null;
      merchant: string;
      category: string;
      type: "cash_withdrawal" | "expense";
    };
    wallet?: CashWallet;
    cashTransaction?: CashTransaction;
  }>("/ml/ingest-sms", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ smsText })
  });
}

export async function getCashWallet() {
  return request<{
    wallet: CashWallet;
    lowCash: boolean;
    lowCashThreshold: number;
    transactions: CashTransaction[];
    alerts: CashAlert[];
  }>("/cash/wallet", {
    method: "GET",
    auth: true
  });
}

export async function addCashExpense(payload: {
  amount: number;
  category: string;
  description?: string;
  source?: "manual" | "voice" | "sms";
}) {
  return request<{
    wallet: CashWallet;
    cashTransaction: CashTransaction;
    expense: Expense;
  }>("/cash/expenses", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function addCashWithdrawal(payload: {
  amount: number;
  source?: "manual" | "sms";
  note?: string;
}) {
  return request<{
    wallet: CashWallet;
    transaction: CashTransaction;
  }>("/cash/withdrawals", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function addCashAdjustment(payload: { amount: number; note?: string }) {
  return request<{
    wallet: CashWallet;
    transaction: CashTransaction;
  }>("/cash/adjustments", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function addCashExpenseFromVoice(transcript: string) {
  return request<{
    wallet: CashWallet;
    cashTransaction: CashTransaction;
    expense: Expense;
    parsed: {
      amount: number;
      category: string;
      description: string;
    };
  }>("/cash/voice-entry", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ transcript })
  });
}

export async function getWeeklyCashReconciliation() {
  return request<{
    summary: {
      withdrawals: number;
      expenses: number;
      gap: number;
      since: string;
    };
  }>("/cash/reconciliation/weekly", {
    method: "GET",
    auth: true
  });
}

export async function runCashReconciliationNow() {
  return request<{
    created: Array<{ userId: string; gap: number }>;
  }>("/cash/reconciliation/run-now", {
    method: "POST",
    auth: true
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE FUNCTIONS TO YOUR EXISTING src/lib/api.ts FILE
// Paste them at the bottom, before the last line.
// ─────────────────────────────────────────────────────────────────────────────

// Budget types (also add these to src/lib/types.ts)
export type Budget = {
  id: string;
  monthlyLimit: number;
  categoryBudgets: Record<string, number>;
};

export type BudgetStatus = {
  monthlyLimit: number;
  categoryBudgets: Record<string, number>;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  spentByCategory: Record<string, number>;
  categoryStatus: Record<string, {
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    isOver: boolean;
  }>;
  isOverBudget: boolean;
  isNearLimit: boolean;
};

// GET /api/budget — fetch the user's saved budget settings
export async function getBudget() {
  return request<{ budget: Budget }>("/budget", {
    method: "GET",
    auth: true
  });
}

// GET /api/budget/status — fetch full budget status with spending breakdown
export async function getBudgetStatus() {
  return request<{ status: BudgetStatus }>("/budget/status", {
    method: "GET",
    auth: true
  });
}

// PATCH /api/budget — update monthly limit and/or category budgets
export async function updateBudget(payload: {
  monthlyLimit?: number;
  categoryBudgets?: Record<string, number>;
}) {
  return request<{ budget: Budget }>("/budget", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export interface ScoreBreakdown {
  totalScore: number;
  level: string;
  levelEmoji: string;
  levelColor: string;
  consistencyScore: number;
  budgetScore: number;
  cashScore: number;
  savingsScore: number;
  streak: number;
  weeklyDelta: number;
  insight: string;
}

export interface ScoreResponse {
  score: ScoreBreakdown;
  levels: Array<{
    name: string;
    min: number;
    max: number;
    emoji: string;
    color: string;
    desc: string;
  }>;
  progressToNext: number;
  nextLevel: string | null;
  nextLevelEmoji: string | null;
}

export interface ScoreHistory {
  history: Array<{ date: string; score: number; level: string }>;
}

export const getFinanceScore = (): Promise<ScoreResponse> =>
  request("/score", { method: "GET", auth: true });

export const getScoreHistory = (days = 30): Promise<ScoreHistory> =>
  request(`/score/history?days=${days}`, { method: "GET", auth: true });

export const recalculateScore = (): Promise<ScoreResponse> =>
  request("/score/recalculate", { method: "POST", auth: true });
