import type {
  CashAlert,
  CashTransaction,
  CashWallet,
  Expense,
  MonthlySummary,
  User,
} from "./types";
import { getCsrfToken, getToken } from "./storage";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// ── Core request helper ───────────────────────────────────────────────────────
type RequestOptions = RequestInit & { auth?: boolean };

const RETRY_DELAYS_MS = [250, 600];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const csrf = getCsrfToken();
      if (csrf) headers["x-csrf-token"] = csrf;
    }
  }
  const isIdempotent = ["GET", "HEAD", "OPTIONS"].includes(method);
  const maxAttempts = isIdempotent ? RETRY_DELAYS_MS.length + 1 : 1;

  let res: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });

      // Retry transient server errors only for idempotent requests.
      if (isIdempotent && res.status >= 500 && attempt < maxAttempts - 1) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      break;
    } catch {
      if (!isIdempotent || attempt >= maxAttempts - 1) break;
      if (navigator.onLine === false) break;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  if (!res) {
    throw new Error(
      navigator.onLine === false
        ? "You're offline. Please reconnect and try again."
        : "Network error. Please try again."
    );
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  return request<{ token: string; refreshToken: string; csrfToken?: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name: string, email: string, password: string) {
  return request<{ user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function refreshSession(refreshToken: string) {
  return request<{ token: string; refreshToken: string; csrfToken?: string }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout() {
  return request<{ message: string }>("/auth/logout", { method: "POST", auth: true });
}

export async function getCsrf() {
  return request<{ csrfToken: string }>("/auth/csrf", { method: "GET", auth: true });
}

export async function getMe() {
  return request<{ user: User }>("/auth/me", { method: "GET", auth: true });
}

// ── Expenses ──────────────────────────────────────────────────────────────────
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
  return request<{
    expenses: Expense[];
    meta: { total: number; page: number; limit: number };
  }>(qs ? `/expenses?${qs}` : "/expenses", { method: "GET", auth: true });
}

export async function addExpense(
  payload: Pick<Expense, "amount" | "category" | "description">
) {
  return request<{ expense: Expense }>("/expenses", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  id: string,
  payload: Partial<Pick<Expense, "amount" | "category" | "description">>
) {
  return request<{ expense: Expense }>(`/expenses/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: string) {
  return request<{ success: boolean }>(`/expenses/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getMonthlySummary() {
  return request<{ summary: MonthlySummary }>("/expenses/summary/monthly", {
    method: "GET",
    auth: true,
  });
}

// ── Budget (Step 1) ───────────────────────────────────────────────────────────
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

export async function getBudget() {
  return request<{ budget: Budget }>("/budget", { method: "GET", auth: true });
}

export async function getBudgetStatus() {
  return request<{ status: BudgetStatus }>("/budget/status", { method: "GET", auth: true });
}

export async function updateBudget(payload: {
  monthlyLimit?: number;
  categoryBudgets?: Record<string, number>;
}) {
  return request<{ budget: Budget }>("/budget", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

// ── ML / SMS (Step 3) ─────────────────────────────────────────────────────────
export async function predictMerchant(merchant: string) {
  return request<{ result: { merchant: string; category: string } }>("/ml/predict", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ merchant }),
  });
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
    body: JSON.stringify({ smsText }),
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
    body: JSON.stringify({ smsText }),
  });
}

// ── Cash Wallet (Step 2) ──────────────────────────────────────────────────────
export async function getCashWallet() {
  return request<{
    wallet: CashWallet;
    lowCash: boolean;
    lowCashThreshold: number;
    transactions: CashTransaction[];
    alerts: CashAlert[];
  }>("/cash/wallet", { method: "GET", auth: true });
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
    body: JSON.stringify(payload),
  });
}

export async function addCashWithdrawal(payload: {
  amount: number;
  source?: "manual" | "sms";
  note?: string;
}) {
  return request<{ wallet: CashWallet; transaction: CashTransaction }>(
    "/cash/withdrawals",
    { method: "POST", auth: true, body: JSON.stringify(payload) }
  );
}

export async function addCashAdjustment(payload: { amount: number; note?: string }) {
  return request<{ wallet: CashWallet; transaction: CashTransaction }>(
    "/cash/adjustments",
    { method: "POST", auth: true, body: JSON.stringify(payload) }
  );
}

export async function addCashExpenseFromVoice(transcript: string) {
  return request<{
    wallet: CashWallet;
    cashTransaction: CashTransaction;
    expense: Expense;
    parsed: { amount: number; category: string; description: string };
  }>("/cash/voice-entry", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ transcript }),
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
  }>("/cash/reconciliation/weekly", { method: "GET", auth: true });
}

export async function runCashReconciliationNow() {
  return request<{ created: Array<{ userId: string; gap: number }> }>(
    "/cash/reconciliation/run-now",
    { method: "POST", auth: true }
  );
}

// ── Finance Score (Step 4) ────────────────────────────────────────────────────
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
  levels: Array<{ name: string; min: number; max: number; emoji: string; color: string; desc: string }>;
  progressToNext: number;
  nextLevel: string | null;
  nextLevelEmoji: string | null;
}

export interface ScoreHistory {
  history: Array<{ date: string; score: number; level: string }>;
}

export async function getFinanceScore() {
  return request<ScoreResponse>("/score", { method: "GET", auth: true });
}

export async function getScoreHistory(days = 30) {
  return request<ScoreHistory>(`/score/history?days=${days}`, { method: "GET", auth: true });
}

export async function recalculateScore() {
  return request<ScoreResponse>("/score/recalculate", { method: "POST", auth: true });
}

// ── Onboarding (Step 5) ───────────────────────────────────────────────────────
export async function getOnboardingStatus() {
  return request<{
    onboardingDone: boolean;
    profile: {
      name: string;
      college: string | null;
      yearOfStudy: number | null;
      city: string | null;
      monthlyAllowance: number | null;
      budgetSplit: Record<string, number> | null;
    };
  }>("/onboarding/status", { method: "GET", auth: true });
}

export async function completeOnboarding(data: {
  college: string;
  yearOfStudy: number;
  city: string;
  monthlyAllowance: number;
  budgetSplit: Record<string, number>;
}) {
  return request<{ success: boolean; user: any }>("/onboarding/complete", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function updateProfile(data: {
  college?: string;
  yearOfStudy?: number;
  city?: string;
  monthlyAllowance?: number;
}) {
  return request<{ success: boolean; user: any }>("/onboarding/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

// Step 6: Push Notifications
export async function registerFcmToken(token: string, platform = "web") {
  return request<{ message: string }>("/notifications/token", {
    method: "POST", auth: true,
    body: JSON.stringify({ token, platform }),
  });
}

export async function removeFcmToken(token: string) {
  return request<{ message: string }>("/notifications/token", {
    method: "DELETE", auth: true,
    body: JSON.stringify({ token }),
  });
}

export async function getNotificationHistory() {
  return request<{ notifications: Array<{ id:string; type:string; title:string; body:string; sentAt:string }> }>(
    "/notifications/history", { auth: true }
  );
}

export async function handleNotificationAction(action: "voice_entry" | "text_entry", text: string) {
  return request<{ success: boolean; expense?: { amount: number; category: string } }>(
    "/notifications/action",
    { method: "POST", auth: true, body: JSON.stringify({ action, text }) }
  );
}
