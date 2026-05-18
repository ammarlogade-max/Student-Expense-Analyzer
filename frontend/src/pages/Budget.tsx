import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBudget, getBudgetStatus, getExpenses } from "../lib/api";
import type { Budget as BudgetData, BudgetStatus } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { readCache, writeCache } from "../lib/swrCache";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Housing",
  "Education",
  "Entertainment",
  "Health",
  "Other",
];

function statusColor(percent: number) {
  if (percent >= 90) return "var(--error)";
  if (percent >= 70) return "var(--warning)";
  return "var(--success)";
}

const BudgetPage = () => {
  useFeatureTracking("budget", "Viewed budget");

  const navigate = useNavigate();
  const { push } = useToast();

  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "forecast">("overview");

  const loadBudgetData = useCallback(async () => {
    const cached = readCache<any>("budget:overview");

    if (cached) {
      setBudget(cached.budget);
      setStatus(cached.status);
      setExpenses(cached.expenses || []);
    }

    try {
      const [budgetResponse, statusResponse, expenseResponse] = await Promise.all([
        getBudget(),
        getBudgetStatus(),
        getExpenses(),
      ]);

      setBudget(budgetResponse.budget);
      setStatus(statusResponse.status);
      setExpenses(expenseResponse.expenses);

      writeCache("budget:overview", {
        budget: budgetResponse.budget,
        status: statusResponse.status,
        expenses: expenseResponse.expenses,
      });
    } catch {
      push("Failed to load budget", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData]);

  const monthlyLimit = budget?.monthlyLimit ?? 0;
  const totalSpent = status?.totalSpent ?? 0;
  const remaining = status?.remaining ?? 0;
  const percentUsed = status?.percentUsed ?? 0;

  const forecastData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    const dailyTotals = new Array(daysInMonth).fill(0);

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);

      if (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        dailyTotals[date.getDate() - 1] += expense.amount;
      }
    });

    let cumulative = 0;

    return dailyTotals.map((value, index) => {
      cumulative += value;

      return {
        day: index + 1,
        actual: cumulative,
      };
    });
  }, [expenses]);

  return (
    <div className="space-y-5 pb-24 stagger">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          Budget
        </h1>

        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Track your monthly spending and category limits.
        </p>
      </div>

      <div className="card card-gradient">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Monthly Budget
            </p>

            <h2
              className="text-3xl font-bold"
              style={{
                color: statusColor(percentUsed),
                fontFamily: "var(--font-display)",
              }}
            >
              ₹{monthlyLimit.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Total Spent
            </p>

            <p
              className="text-lg font-bold mt-1"
              style={{ color: "var(--text-primary)" }}
            >
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="progress-track" style={{ height: 8 }}>
          <div
            className="progress-bar"
            style={{
              width: `${Math.min(percentUsed, 100)}%`,
              background: statusColor(percentUsed),
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <span style={{ color: "var(--text-secondary)" }}>
            {percentUsed.toFixed(1)}% used
          </span>

          <span
            style={{
              color:
                remaining < 0 ? "var(--error)" : "var(--success)",
            }}
          >
            {remaining < 0
              ? `Over by ₹${Math.abs(remaining).toLocaleString("en-IN")}`
              : `₹${remaining.toLocaleString("en-IN")} remaining`}
          </span>
        </div>

        <button
          onClick={() => navigate("/settings")}
          className="btn-secondary mt-5"
        >
          Edit Budget in Settings
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Categories
        </button>

        <button
          className={`tab-item ${activeTab === "forecast" ? "active" : ""}`}
          onClick={() => setActiveTab("forecast")}
        >
          Forecast
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryLimit = budget?.categoryBudgets?.[category] ?? 0;
            const categorySpent = status?.spentByCategory?.[category] ?? 0;
            const categoryPercent =
              categoryLimit > 0
                ? (categorySpent / categoryLimit) * 100
                : 0;

            return (
              <div key={category} className="card !p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {category}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      ₹{categorySpent.toLocaleString("en-IN")} spent
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className="text-sm font-bold"
                      style={{ color: statusColor(categoryPercent) }}
                    >
                      ₹{categoryLimit.toLocaleString("en-IN")}
                    </p>

                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      limit
                    </p>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(categoryPercent, 100)}%`,
                      background: statusColor(categoryPercent),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "forecast" && (
        <div className="card">
          <div className="mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Spending Forecast
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Compare actual monthly spending against your budget.
            </p>
          </div>

          {loading ? (
            <div className="skeleton h-56" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis tick={{ fontSize: 10 }} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />

                  <ReferenceLine
                    y={monthlyLimit}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
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
