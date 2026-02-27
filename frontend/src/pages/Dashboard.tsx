import { useEffect, useMemo, useState } from "react";
import {
  addExpense,
  getCashWallet,
  getExpenses,
  getMonthlySummary,
  recalculateScore
} from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import FinanceScoreCard from "../components/FinanceScoreCard";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Housing",
  "Education",
  "Entertainment",
  "Health",
  "Other"
];

const catEmoji: Record<string, string> = {
  Food: "??",
  Shopping: "???",
  Transport: "??",
  Housing: "??",
  Education: "??",
  Entertainment: "??",
  Health: "??",
  Other: "??"
};

const catColors: Record<string, string> = {
  Food: "#c8ff00",
  Shopping: "#00e5c3",
  Transport: "#ffb930",
  Housing: "#f97316",
  Education: "#60a5fa",
  Entertainment: "#a78bfa",
  Health: "#ff4d6d",
  Other: "#6b7a99"
};

function StatCard({
  title,
  value,
  sub,
  icon,
  color = "var(--lime)"
}: {
  title: string;
  value: string;
  sub: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="card p-4 animate-fade-up" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-xl font-black leading-tight" style={{ fontFamily: "var(--font-display)", color }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {sub}
      </p>
    </div>
  );
}

const Dashboard = () => {
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

    async function load() {
      setLoading(true);
      try {
        const [expRes, sumRes, cashRes] = await Promise.allSettled([
          getExpenses({ limit: 5 }),
          getMonthlySummary(),
          getCashWallet()
        ]);

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
      } catch {
        push("Dashboard load failed", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const topCategories = useMemo(
    () => Object.entries(summaryByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4),
    [summaryByCategory]
  );

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
      await addExpense({
        amount: Number(quickAdd.amount),
        category: quickAdd.category,
        description: quickAdd.description || undefined
      });

      const [expRes] = await Promise.allSettled([getExpenses({ limit: 5 }), recalculateScore()]);
      if (expRes.status === "fulfilled") setExpenses(expRes.value.expenses);

      setQuickAdd({ amount: "", category: "Food", description: "" });
      setQuickAddOpen(false);
      push("Expense added", "success");
    } catch {
      push("Failed to add expense", "error");
    } finally {
      setQuickSaving(false);
    }
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-5 stagger">
      <div className="animate-fade-up">
        <p className="text-sm mb-0.5" style={{ color: "var(--text-muted)" }}>
          {greeting}
        </p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
          Your Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="This Month"
          value={`?${summaryTotal.toLocaleString("en-IN")}`}
          sub="Total spent"
          icon="??"
          color="var(--lime)"
        />
        <StatCard
          title="Avg / Day"
          value={`?${avgPerDay.toFixed(0)}`}
          sub="Month-to-date"
          icon="??"
          color="var(--teal)"
        />
        <StatCard
          title="Expenses"
          value={expenses.length.toString()}
          sub="Recent entries"
          icon="??"
          color="var(--amber)"
        />
        <StatCard
          title="Cash Wallet"
          value={`?${cashBalance.toFixed(0)}`}
          sub={cashLow ? "Low balance" : "Healthy balance"}
          icon="??"
          color={cashLow ? "var(--rose)" : "var(--lime)"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr_1fr]">
        <div className="flex flex-col gap-3">
          <FinanceScoreCard compact />
          <button onClick={() => navigate("/score")} className="btn-ghost text-xs py-2 text-center w-full">
            View full score breakdown ?
          </button>
        </div>

        <div className="card p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Recent Expenses</h3>
            <button onClick={() => navigate("/expenses")} className="text-xs font-semibold" style={{ color: "var(--lime)" }}>
              See all ?
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No expenses yet
                </p>
              </div>
            ) : (
              expenses.slice(0, 5).map((exp) => {
                const color = catColors[exp.category] || "#6b7a99";
                return (
                  <div
                    key={exp.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                    }}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${color}15` }}>
                      {catEmoji[exp.category] || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-tight">{exp.category}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                        {exp.description || "No note"}
                      </p>
                    </div>
                    <p className="text-sm font-black flex-shrink-0 tabular-nums" style={{ fontFamily: "var(--font-display)", color }}>
                      -?{exp.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <h3 className="font-bold text-sm mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Log expenses to see categories
                </p>
              </div>
            ) : (
              topCategories.map(([cat, val]) => {
                const color = catColors[cat] || "#6b7a99";
                const pct = summaryTotal > 0 ? (val / summaryTotal) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        {catEmoji[cat]} {cat}
                      </span>
                      <span className="font-bold tabular-nums" style={{ color }}>
                        ?{val.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {topCategories.length > 0 && (
            <button onClick={() => navigate("/analytics")} className="btn-ghost w-full text-xs py-2 mt-4">
              Full analytics ?
            </button>
          )}
        </div>
      </div>

      <button
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl z-40 transition-transform hover:scale-110 active:scale-95"
        style={{ background: "var(--lime)", color: "#080c12" }}
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add expense"
      >
        +
      </button>

      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick Add">
        <form className="space-y-4" onSubmit={handleQuickAdd}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl" style={{ color: "var(--text-muted)" }}>
              ?
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
                <button
                  key={cat}
                  type="button"
                  onClick={() => setQuickAdd({ ...quickAdd, category: cat })}
                  className="cat-chip text-xs transition-all"
                  style={
                    active
                      ? {
                          background: `${color}18`,
                          borderColor: color,
                          color,
                          transform: "scale(1.05)"
                        }
                      : {}
                  }
                >
                  {catEmoji[cat]} {cat}
                </button>
              );
            })}
          </div>

          <textarea
            value={quickAdd.description}
            onChange={(e) => setQuickAdd({ ...quickAdd, description: e.target.value })}
            placeholder="Note (optional)"
            style={{ minHeight: 60, resize: "none" }}
          />

          <button type="submit" disabled={quickSaving} className="btn-primary w-full" style={{ height: 46 }}>
            {quickSaving ? "Adding..." : "Add Expense ?"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
