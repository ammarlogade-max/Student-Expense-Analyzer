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

function StatCard({ title, value, sub, icon, gradient }: { title: string; value: string; sub: string; icon: string; gradient: string }) {
  return (
    <div className="stat-card min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div className="stat-icon" style={{ background: `${gradient}20`, border: `1px solid ${gradient}30` }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
      </div>
      <p className="text-2xl font-bold mb-1 truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {sub}
      </p>
    </div>
  );
}

const Dashboard = () => {
  useFeatureTracking("dashboard", "Viewed dashboard");
  const { push } = useToast();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [cashBalance, setCashBalance] = useState(0);
  const [cashLow, setCashLow] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState({ amount: "", category: "Food", description: "" });
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const cacheKey = "dashboard:home";

    async function load() {
      const cached = readCache<{
        expenses: Expense[];
        summaryTotal: number;
        summaryByCategory: Record<string, number>;
        cashBalance: number;
        cashLow: boolean;
      }>(cacheKey);

      if (cached && active) {
        setExpenses(cached.expenses);
        setSummaryTotal(cached.summaryTotal);
        setSummaryByCategory(cached.summaryByCategory);
        setCashBalance(cached.cashBalance);
        setCashLow(cached.cashLow);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [expRes, sumRes, cashRes] = await Promise.allSettled([getExpenses({ limit: 5 }), getMonthlySummary(), getCashWallet()]);
        if (!active) return;

        if (expRes.status === "fulfilled") setExpenses(expRes.value.expenses);
        if (sumRes.status === "fulfilled") {
          setSummaryTotal(sumRes.value.summary.total);
          setSummaryByCategory(sumRes.value.summary.byCategory);
        }
        if (cashRes.status === "fulfilled") {
          setCashBalance(cashRes.value.wallet.balance);
          setCashLow(cashRes.value.lowCash);
        }

        if (expRes.status === "fulfilled" && sumRes.status === "fulfilled" && cashRes.status === "fulfilled") {
          writeCache(cacheKey, {
            expenses: expRes.value.expenses,
            summaryTotal: sumRes.value.summary.total,
            summaryByCategory: sumRes.value.summary.byCategory,
            cashBalance: cashRes.value.wallet.balance,
            cashLow: cashRes.value.lowCash,
          });
        }
      } catch {
        push("Load failed", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const topCategories = useMemo(() => Object.entries(summaryByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4), [summaryByCategory]);
  const avgPerDay = useMemo(() => {
    const d = new Date().getDate();
    return d ? summaryTotal / d : 0;
  }, [summaryTotal]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.amount) {
      push("Amount required", "error");
      return;
    }

    setQuickSaving(true);
    try {
      await addExpense({ amount: Number(quickAdd.amount), category: quickAdd.category, description: quickAdd.description || undefined });
      const [expRes] = await Promise.allSettled([getExpenses({ limit: 5 }), recalculateScore()]);
      if (expRes.status === "fulfilled") setExpenses(expRes.value.expenses);
      setQuickAdd({ amount: "", category: "Food", description: "" });
      setQuickAddOpen(false);
      push("Expense added", "success");
    } catch {
      push("Failed", "error");
    } finally {
      setQuickSaving(false);
    }
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, []);

  return (
    <div className="space-y-5 stagger">
      <div>
        <p className="text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>
          {greeting}
        </p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 animate-fade-up">
        <StatCard title="This Month" value={`₹${summaryTotal.toLocaleString("en-IN")}`} sub="Total spent" icon="📳" gradient="#6366f1" />
        <StatCard title="Daily Avg" value={`₹${avgPerDay.toFixed(0)}`} sub="Month-to-date" icon="📅" gradient="#14b8a6" />
        <StatCard title="Transactions" value={String(expenses.length)} sub="Recent entries" icon="🧾" gradient="#f59e0b" />
        <StatCard title="Cash Wallet" value={`₹${cashBalance.toFixed(0)}`} sub={cashLow ? "Low balance" : "Looking healthy"} icon="💵" gradient={cashLow ? "#ef4444" : "#10b981"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr] min-w-0">
        <div className="flex flex-col gap-3 min-w-0">
          <FinanceScoreCard compact />
          <button onClick={() => navigate("/score")} className="btn-ghost w-full text-xs whitespace-nowrap">
            View full score breakdown →
          </button>
        </div>
        <div className="card animate-fade-up min-w-0" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Recent Expenses
            </h3>
            <button onClick={() => navigate("/expenses")} className="text-xs font-semibold transition whitespace-nowrap" style={{ color: "var(--primary)" }}>
              See all →
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-[60px]" />)
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" style={{ border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-lg)" }}>
                <span className="text-3xl mb-2">💸</span>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No expenses yet
                </p>
                <button onClick={() => setQuickAddOpen(true)} className="btn-primary mt-4 text-xs px-4 py-2" style={{ minHeight: 36 }}>
                  Add first expense →
                </button>
              </div>
            ) : (
              expenses.map((exp) => {
                const color = catColors[exp.category] || "#94a3b8";
                return (
                  <div key={exp.id} className="expense-row">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                      {catEmoji[exp.category] || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {exp.category}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }} title={exp.description || "No note"}>
                        {exp.description || "No note"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums" style={{ color }}>
                        -₹{exp.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(exp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="card animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Spending by Category
            </h3>
            <button onClick={() => navigate("/analytics")} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
              Analytics →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topCategories.map(([cat, val]) => {
              const color = catColors[cat] || "#94a3b8";
              const pct = summaryTotal > 0 ? (val / summaryTotal) * 100 : 0;
              return (
                <div key={cat} className="rounded-xl p-3.5 transition" style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                  <span className="text-2xl">{catEmoji[cat]}</span>
                  <p className="text-xs font-medium mt-2 mb-0.5" style={{ color: "var(--text-secondary)" }}>
                    {cat}
                  </p>
                  <p className="text-sm font-bold" style={{ color }}>
                    ₹{val.toLocaleString("en-IN")}
                  </p>
                  <div className="progress-track mt-2" style={{ height: 4 }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black transition-all hover:scale-110 active:scale-95 lg:bottom-6 lg:right-6"
        style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 32px rgba(99,102,241,0.4)", color: "#fff" }}
        aria-label="Add expense"
      >
        +
      </button>

      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick Add Expense">
        <form className="space-y-4" onSubmit={handleQuickAdd}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "var(--text-tertiary)" }}>
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={quickAdd.amount}
              onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
              placeholder="0.00"
              style={{ paddingLeft: 36, fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const color = catColors[cat];
              const active = quickAdd.category === cat;
              return (
                <button key={cat} type="button" onClick={() => setQuickAdd({ ...quickAdd, category: cat })} className="cat-chip" style={active ? { background: `${color}18`, borderColor: color, color } : {}}>
                  {catEmoji[cat]} {cat}
                </button>
              );
            })}
          </div>
          <textarea rows={2} value={quickAdd.description} onChange={(e) => setQuickAdd({ ...quickAdd, description: e.target.value })} placeholder="Note (optional)" style={{ resize: "none" }} />
          <button type="submit" disabled={quickSaving} className="btn-primary w-full">
            {quickSaving ? "Adding..." : "Add Expense →"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
