import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";

const STORAGE_KEY = "sea_budget_limit";
const CATEGORY_KEY = "sea_category_budgets";
const categories = [
  "Food",
  "Transport",
  "Housing",
  "Education",
  "Entertainment",
  "Health",
  "Other"
];

const Budget = () => {
  const [limit, setLimit] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : 500;
  });
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    () => {
      const raw = localStorage.getItem(CATEGORY_KEY);
      if (!raw) {
        return Object.fromEntries(categories.map((c) => [c, 100]));
      }
      try {
        return JSON.parse(raw);
      } catch {
        return Object.fromEntries(categories.map((c) => [c, 100]));
      }
    }
  );
  const [total, setTotal] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [summaryRes, expensesRes] = await Promise.all([
          getMonthlySummary(),
          getExpenses()
        ]);
        if (!active) return;
        setTotal(summaryRes.summary.total);
        setExpenses(expensesRes.expenses);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(limit));
  }, [limit]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  const percentUsed = useMemo(() => {
    if (limit <= 0) return 0;
    return Math.min(100, (total / limit) * 100);
  }, [limit, total]);

  const remaining = limit - total;

  const tone =
    percentUsed >= 90 ? "rose" : percentUsed >= 70 ? "amber" : "emerald";

  const { series, forecastTotal } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyTotals = new Array(daysInMonth).fill(0);
    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        dailyTotals[day - 1] += expense.amount;
      }
    });

    let cumulative = 0;
    const data = dailyTotals.map((value, index) => {
      cumulative += value;
      return {
        day: index + 1,
        actual: Number(cumulative.toFixed(2))
      };
    });

    const today = now.getDate();
    const todayTotal = data[today - 1]?.actual ?? cumulative;
    const dailyAvg = today ? todayTotal / today : 0;
    const projected = dailyAvg * daysInMonth;

    const forecastSeries = data.map((point) => ({
      ...point,
      forecast: Number((dailyAvg * point.day).toFixed(2))
    }));

    return { series: forecastSeries, forecastTotal: projected };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-400 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Budget System
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
          Stay in control with smart limits.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Monitor spending against your monthly target and get real-time
          warnings as you approach your cap.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Set Monthly Budget</h3>
          <p className="text-sm text-slate-500">
            Adjust anytime. We use it to calculate your remaining balance.
          </p>
          <div className="mt-6">
            <label className="text-sm font-medium">Monthly limit</label>
            <input
              type="number"
              min="0"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            Your budget powers insights across Dashboard, Analytics, and
            Expenses.
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Budget Status</h3>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total spent
              </p>
              <p className="text-3xl font-semibold text-slate-900">
                ₹{total.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Remaining
              </p>
              <p className="text-2xl font-semibold text-slate-800">
                ₹{remaining.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Usage</span>
                <span>{percentUsed.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${
                    tone === "rose"
                      ? "bg-rose-500"
                      : tone === "amber"
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                tone === "rose"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : tone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {loading
                ? "Loading summary..."
                : tone === "rose"
                ? "You are very close to your budget limit. Consider pausing big purchases."
                : tone === "amber"
                ? "You are approaching your limit. Keep an eye on discretionary spending."
                : "You are within a healthy range. Keep it up!"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Category Budgets</h3>
        <p className="text-sm text-slate-500">
          Allocate budgets per category and monitor thresholds.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const value = categoryBudgets[category] ?? 0;
            const over = value <= 0;
            return (
              <div
                key={category}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{category}</span>
                  <span>₹{value}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) =>
                    setCategoryBudgets({
                      ...categoryBudgets,
                      [category]: Math.max(0, Number(e.target.value) || 0)
                    })
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={`Type ${category} limit`}
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={value}
                  onChange={(e) =>
                    setCategoryBudgets({
                      ...categoryBudgets,
                      [category]: Number(e.target.value)
                    })
                  }
                  className="mt-3 w-full"
                />
                {over && (
                  <p className="mt-2 text-xs text-rose-600">
                    Set a budget to activate alerts.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Budget vs Actual</h3>
            <p className="text-sm text-slate-500">
              Forecast based on current month daily average.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Forecast end-of-month:{" "}
            <span className="font-semibold text-slate-900">
              ₹{forecastTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-6 h-72">
          {loading ? (
            <div className="h-full rounded-2xl bg-slate-100 animate-pulse" />
          ) : series.length === 0 ? (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
              Add expenses to see forecasting trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                />
                <ReferenceLine
                  y={limit}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
};

export default Budget;
