import { useEffect, useMemo, useState } from "react";
import { addExpense, getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

const Dashboard = () => {
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryByCategory, setSummaryByCategory] = useState<
    Record<string, number>
  >({});
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    amount: "",
    category: "Food",
    description: ""
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [expensesRes, summaryRes] = await Promise.all([
          getExpenses(),
          getMonthlySummary()
        ]);
        if (!active) return;
        setExpenses(expensesRes.expenses);
        setSummaryTotal(summaryRes.summary.total);
        setSummaryByCategory(summaryRes.summary.byCategory);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const topCategories = useMemo(() => {
    return Object.entries(summaryByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [summaryByCategory]);

  const currentMonthAverage = useMemo(() => {
    const today = new Date();
    const daysPassed = today.getDate();
    return daysPassed ? summaryTotal / daysPassed : 0;
  }, [summaryTotal]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Smart Summary
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
          Your finances, beautifully clear.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Track spending, forecast your month, and make better choices with live data.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Spending",
            value: `₹${summaryTotal.toFixed(2)}`,
            note: "This month"
          },
          {
            title: "Avg / Day",
            value: `₹${currentMonthAverage.toFixed(2)}`,
            note: "Month-to-date"
          },
          {
            title: "Total Expenses",
            value: expenses.length.toString(),
            note: "Logged items"
          },
          {
            title: "Top Category",
            value: topCategories[0]?.[0] || "None yet",
            note: topCategories[0]
              ? `₹${topCategories[0][1].toFixed(2)}`
              : "Add your first expense"
          },
          {
            title: "MoM Change",
            value: "—",
            note: "Not enough data yet"
          }
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              {card.title}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Expenses</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-600">
              Live
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-14 rounded-2xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No expenses yet. Add one from the Expenses tab.
              </div>
            ) : (
              expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {expense.category}
                    </p>
                    <p className="text-xs text-slate-500">
                      {expense.description || "No description"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      ₹{expense.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Top Categories</h3>
          <div className="mt-4 space-y-3">
            {topCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Categories will appear once you log expenses.
              </div>
            ) : (
              topCategories.map(([category, value]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{category}</span>
                    <span>₹{value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (value / summaryTotal) * 100 || 0
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <button
        className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-2xl font-semibold text-white shadow-2xl hover:bg-emerald-600"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add expense"
      >
        +
      </button>

      <Modal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add Expense"
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!quickAdd.amount) {
              push("Amount required", "error");
              return;
            }
            try {
              await addExpense({
                amount: Number(quickAdd.amount),
                category: quickAdd.category,
                description: quickAdd.description || undefined
              });
              setQuickAdd({ amount: "", category: "Food", description: "" });
              setQuickAddOpen(false);
              push("Expense added", "success");
            } catch {
              push("Failed to add expense", "error");
            }
          }}
        >
          <input
            type="number"
            value={quickAdd.amount}
            onChange={(e) =>
              setQuickAdd({ ...quickAdd, amount: e.target.value })
            }
            placeholder="Amount"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            value={quickAdd.category}
            onChange={(e) =>
              setQuickAdd({ ...quickAdd, category: e.target.value })
            }
            placeholder="Category"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <textarea
            value={quickAdd.description}
            onChange={(e) =>
              setQuickAdd({ ...quickAdd, description: e.target.value })
            }
            placeholder="Description"
            className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <button className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
            Add expense
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
