import { useEffect, useMemo, useState } from "react";
import { addExpense, getCashWallet, getExpenses, getMonthlySummary, recalculateScore } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import FinanceScoreCard from "../components/FinanceScoreCard";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { readCache, writeCache } from "../lib/swrCache";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const catEmoji: Record<string, string> = {
  Food: "🍔",
  Shopping: "🛍️",
  Transport: "🚇",
  Housing: "🏠",
  Education: "📚",
  Entertainment: "🎬",
  Health: "💊",
  Other: "📦",
};

const catColors: Record<string, string> = {
  Food: "#f59e0b",
  Shopping: "#ec4899",
  Transport: "#14b8a6",
  Housing: "#f97316",
  Education: "#6366f1",
  Entertainment: "#a78bfa",
  Health: "#10b981",
  Other: "#94a3b8",
};

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="card min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-tertiary)" }}>
        {title}
      </p>

      <h3 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
        {value}
      </h3>

      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
        {subtitle}
      </p>
    </div>
  );
}

const Dashboard = () => {
  useFeatureTracking("dashboard", "Viewed dashboard");

  const navigate = useNavigate();
  const { push } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [cashBalance, setCashBalance] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);

  const [quickAdd, setQuickAdd] = useState({
    amount: "",
    category: "Food",
    description: "",
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      const cached = readCache<any>("dashboard:home");

      if (cached && active) {
        setExpenses(cached.expenses || []);
        setSummaryTotal(cached.summaryTotal || 0);
        setSummaryByCategory(cached.summaryByCategory || {});
        setCashBalance(cached.cashBalance || 0);
      }

      try {
        const [expenseData, summaryData, cashData] = await Promise.all([
          getExpenses({ limit: 5 }),
          getMonthlySummary(),
          getCashWallet(),
        ]);

        if (!active) return;

        setExpenses(expenseData.expenses);
        setSummaryTotal(summaryData.summary.total);
        setSummaryByCategory(summaryData.summary.byCategory);
        setCashBalance(cashData.wallet.balance);

        writeCache("dashboard:home", {
          expenses: expenseData.expenses,
          summaryTotal: summaryData.summary.total,
          summaryByCategory: summaryData.summary.byCategory,
          cashBalance: cashData.wallet.balance,
        });
      } catch {
        push("Failed to load dashboard", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const topCategories = useMemo(() => {
    return Object.entries(summaryByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [summaryByCategory]);

  const averagePerDay = useMemo(() => {
    const day = new Date().getDate();
    return day ? summaryTotal / day : 0;
  }, [summaryTotal]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickAdd.amount) {
      push("Amount is required", "error");
      return;
    }

    setQuickSaving(true);

    try {
      await addExpense({
        amount: Number(quickAdd.amount),
        category: quickAdd.category,
        description: quickAdd.description || undefined,
      });

      await recalculateScore();

      const updated = await getExpenses({ limit: 5 });
      setExpenses(updated.expenses);

      setQuickAdd({
        amount: "",
        category: "Food",
        description: "",
      });

      setQuickAddOpen(false);
      push("Expense added successfully", "success");
    } catch {
      push("Failed to add expense", "error");
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
          {greeting}
        </p>

        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Monthly Spend" value={`₹${summaryTotal.toLocaleString("en-IN")}`} subtitle="This month" />

        <StatCard title="Daily Average" value={`₹${averagePerDay.toFixed(0)}`} subtitle="Average spending" />

        <StatCard title="Transactions" value={String(expenses.length)} subtitle="Recent entries" />

        <StatCard title="Cash Balance" value={`₹${cashBalance.toFixed(0)}`} subtitle="Wallet balance" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <FinanceScoreCard compact />

          <button
            onClick={() => navigate("/score")}
            className="btn-secondary w-full"
          >
            Open Full Score
          </button>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Expenses
              </h2>

              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Latest expense activity
              </p>
            </div>

            <button
              onClick={() => navigate("/expenses")}
              className="text-xs font-semibold"
              style={{ color: "var(--primary)" }}
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="skeleton h-[64px]" />
              ))
            ) : expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No expenses added yet
                </p>
              </div>
            ) : (
              expenses.map((expense) => {
                const color = catColors[expense.category] || "#94a3b8";

                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0"
                      style={{
                        background: `${color}15`,
                        color,
                      }}
                    >
                      {catEmoji[expense.category] || "📦"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {expense.category}
                      </p>

                      <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                        {expense.description || "No description"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color }}>
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Top Categories
            </h2>

            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Highest spending categories
            </p>
          </div>

          <button
            onClick={() => navigate("/analytics")}
            className="text-xs font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Analytics
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topCategories.map(([category, value]) => {
            const color = catColors[category] || "#94a3b8";

            return (
              <div
                key={category}
                className="rounded-2xl p-4"
                style={{
                  background: `${color}10`,
                  border: `1px solid ${color}20`,
                }}
              >
                <div className="text-2xl">{catEmoji[category]}</div>

                <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
                  {category}
                </p>

                <p className="text-sm font-bold mt-1" style={{ color }}>
                  ₹{value.toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
        }}
      >
        +
      </button>

      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick Add Expense">
        <form className="space-y-4" onSubmit={handleQuickAdd}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={quickAdd.amount}
            onChange={(e) =>
              setQuickAdd({
                ...quickAdd,
                amount: e.target.value,
              })
            }
            placeholder="Expense amount"
          />

          <select
            value={quickAdd.category}
            onChange={(e) =>
              setQuickAdd({
                ...quickAdd,
                category: e.target.value,
              })
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <textarea
            rows={3}
            placeholder="Description"
            value={quickAdd.description}
            onChange={(e) =>
              setQuickAdd({
                ...quickAdd,
                description: e.target.value,
              })
            }
          />

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={quickSaving}
          >
            {quickSaving ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
