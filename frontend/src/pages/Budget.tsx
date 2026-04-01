import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBudget, getBudgetStatus, getExpenses } from "../lib/api";
import type { Budget as BudgetData, BudgetStatus } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { readCache, writeCache } from "../lib/swrCache";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

function statusColor(pct: number) {
  if (pct >= 90) return "var(--error)";
  if (pct >= 70) return "var(--warning)";
  return "var(--success)";
}

function statusLabel(pct: number) {
  if (pct >= 90) return "Over limit";
  if (pct >= 70) return "Watch out";
  return "On track";
}

const BudgetPage = () => {
  useFeatureTracking("budget", "Viewed budget");
  const navigate = useNavigate();
  const { push } = useToast();

  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "forecast">("categories");

  const loadAll = useCallback(async () => {
    const cacheKey = "budget:overview";
    const cached = readCache<{ budget: BudgetData | null; status: BudgetStatus | null; expenses: Expense[] }>(cacheKey);

    if (cached) {
      setBudget(cached.budget);
      setStatus(cached.status);
      setExpenses(cached.expenses);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [bRes, sRes, eRes] = await Promise.allSettled([getBudget(), getBudgetStatus(), getExpenses()]);

      if (bRes.status === "fulfilled") setBudget(bRes.value.budget);
      if (sRes.status === "fulfilled") setStatus(sRes.value.status);
      if (eRes.status === "fulfilled") setExpenses(eRes.value.expenses);

      writeCache(cacheKey, {
        budget: bRes.status === "fulfilled" ? bRes.value.budget : cached?.budget ?? null,
        status: sRes.status === "fulfilled" ? sRes.value.status : cached?.status ?? null,
        expenses: eRes.status === "fulfilled" ? eRes.value.expenses : cached?.expenses ?? [],
      });
    } catch {
      push("Failed to load budget", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const { series, forecastTotal } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daily = new Array(daysInMonth).fill(0);

    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        daily[d.getDate() - 1] += e.amount;
      }
    });

    let cumulative = 0;
    const data = daily.map((value, index) => {
      cumulative += value;
      return { day: index + 1, actual: Number(cumulative.toFixed(2)) };
    });

    const today = now.getDate();
    const avgPerDay = today ? (data[today - 1]?.actual ?? 0) / today : 0;

    return {
      series: data.map((point) => ({
        ...point,
        forecast: Number((avgPerDay * point.day).toFixed(2)),
      })),
      forecastTotal: avgPerDay * daysInMonth,
    };
  }, [expenses]);

  const monthlyLimit = budget?.monthlyLimit ?? 0;
  const totalSpent = status?.totalSpent ?? 0;
  const pct = status?.percentUsed ?? 0;
  const remaining = status?.remaining ?? 0;
  const sc = statusColor(pct);

  const tabs = [
    { id: "categories" as const, label: "Categories" },
    { id: "forecast" as const, label: "Forecast" },
  ];

  return (
    <div className="space-y-4 stagger">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Budget
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Budget is set during onboarding. Use Settings to change it.
        </p>
      </div>

      <div className="card card-gradient">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Monthly Budget
            </p>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: sc }}>
              ₹{monthlyLimit.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="badge rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${sc}18`, color: sc, border: `1px solid ${sc}30` }}>
              {statusLabel(pct)}
            </span>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              ₹{totalSpent.toLocaleString("en-IN")} spent
            </p>
          </div>
        </div>

        <div className="progress-track" style={{ height: 8 }}>
          <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: sc }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span style={{ color: "var(--text-tertiary)" }}>{pct.toFixed(1)}% used</span>
          <span style={{ color: remaining < 0 ? "var(--error)" : "var(--success)" }}>
            {remaining < 0 ? `Over by ₹${Math.abs(remaining).toLocaleString("en-IN")}` : `₹${remaining.toLocaleString("en-IN")} remaining`}
          </span>
        </div>

        <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
          Budget editing is locked here. To change monthly budget or category split, go to Settings.
        </div>
        <button onClick={() => navigate("/settings")} className="btn-secondary mt-3" type="button">
          Open Settings
        </button>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-item ${activeTab === tab.id ? "active" : ""}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "categories" && (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catStatus = status?.categoryStatus?.[cat];
            const savedLimit = budget?.categoryBudgets?.[cat] ?? 0;
            const spent = status?.spentByCategory?.[cat] ?? 0;
            const catPct = catStatus?.percentUsed ?? 0;
            const catColor = statusColor(catPct);

            return (
              <div key={cat} className="card !p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {cat}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    ₹{spent.toLocaleString("en-IN")} / ₹{savedLimit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${Math.min(catPct, 100)}%`, background: catColor }} />
                </div>
                {catStatus?.isOver && (
                  <p className="mt-2 text-xs" style={{ color: "var(--error)" }}>
                    Over budget by ₹{Math.abs(catStatus.remaining).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "forecast" && (
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Budget vs Actual
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Forecast based on daily average
              </p>
            </div>
            <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Forecast: </span>
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                ₹{forecastTotal.toFixed(0)}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="skeleton h-56" />
          ) : series.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center" style={{ border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-lg)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Add expenses to see forecast
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
                  <YAxis
                    stroke="rgba(255,255,255,0.1)"
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    width={50}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-medium)", borderRadius: 12, color: "var(--text-primary)" }} />
                  <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Forecast" />
                  {monthlyLimit > 0 && <ReferenceLine y={monthlyLimit} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Limit", fill: "#ef4444", fontSize: 10 }} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
