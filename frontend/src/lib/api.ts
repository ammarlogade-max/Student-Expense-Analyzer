import type { Expense, MonthlySummary, User } from "./types";
import { getToken } from "./storage";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

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
    };
  }>("/ml/parse-sms", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ smsText })
  });
}
