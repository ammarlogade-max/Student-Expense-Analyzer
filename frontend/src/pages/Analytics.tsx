import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";

const palette = [
  "#10b981",
  "#38bdf8",
  "#f59e0b",
  "#f97316",
  "#6366f1",
  "#ec4899"
];

const Analytics = () => {
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaryByCategory, setSummaryByCategory] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [compareMode, setCompareMode] = useState<"none" | "prev">("prev");
  const [compareDelta, setCompareDelta] = useState<number | null>(null);
  const [showTrend, setShowTrend] = useState(true);
  const [showPie, setShowPie] = useState(true);

  const handleExportCsv = () => {
    if (!expenses.length) {
      push("No data to export", "error");
      return;
    }

    const rows = expenses.map((item) => ({
      category: item.category,
      amount: item.amount,
      date: new Date(item.createdAt).toISOString()
    }));

    const header = ["category", "amount", "date"];
    const csvLines = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map((key) => {
            const value = String(row[key as keyof typeof row] ?? "");
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      )
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    push("CSV downloaded", "success");
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [expensesRes, summaryRes] = await Promise.all([
          getExpenses(
            range.startDate || range.endDate ? range : undefined
          ),
          getMonthlySummary()
        ]);
        if (!active) return;
        setExpenses(expensesRes.expenses);
        setSummaryByCategory(summaryRes.summary.byCategory);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [range]);

  useEffect(() => {
    if (!range.startDate || !range.endDate || compareMode === "none") {
      setCompareDelta(null);
      return;
    }
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    );
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    getExpenses({
      startDate: prevStart.toISOString().slice(0, 10),
      endDate: prevEnd.toISOString().slice(0, 10)
    })
      .then((res) => {
        const prevTotal = res.expenses.reduce((sum, item) => sum + item.amount, 0);
        const currTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
        setCompareDelta(currTotal - prevTotal);
      })
      .catch(() => setCompareDelta(null));
  }, [range, compareMode, expenses]);

  const categoryData = useMemo(
    () =>
      Object.entries(summaryByCategory).map(([name, value]) => ({
        name,
        value
      })),
    [summaryByCategory]
  );

  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + expense.amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }, [expenses]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Analytics
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
          Insights powered by your real data.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Track category momentum, monthly trends, and spending insights across
          every transaction you log.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Time Range</h3>
            <p className="text-sm text-slate-500">
              Filter analytics by custom dates and compare to the previous period.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={range.startDate}
              onChange={(e) => setRange({ ...range, startDate: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              type="date"
              value={range.endDate}
              onChange={(e) => setRange({ ...range, endDate: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            />
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value as "none" | "prev")}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="prev">Compare to previous period</option>
              <option value="none">No comparison</option>
            </select>
            <button
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"
              onClick={handleExportCsv}
            >
              Export CSV
            </button>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showTrend}
                onChange={(e) => setShowTrend(e.target.checked)}
              />
              Trend
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showPie}
                onChange={(e) => setShowPie(e.target.checked)}
              />
              Category Pie
            </label>
          </div>
        </div>
        {compareDelta !== null && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
            {compareDelta >= 0
              ? `Spending is up by ₹${compareDelta.toFixed(2)} vs previous period.`
              : `Spending is down by ₹${Math.abs(compareDelta).toFixed(2)} vs previous period.`}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Monthly Spending Trend</h3>
          <div className="mt-6 h-64">
            {!showTrend ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                Trend hidden.
              </div>
            ) : loading ? (
              <div className="h-full rounded-2xl bg-slate-100 animate-pulse" />
            ) : monthlySeries.length === 0 ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                Add expenses to see trendlines.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Category Share</h3>
          <div className="mt-6 h-64">
            {!showPie ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                Category chart hidden.
              </div>
            ) : loading ? (
              <div className="h-full rounded-2xl bg-slate-100 animate-pulse" />
            ) : categoryData.length === 0 ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                Categories will show once you log expenses.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={palette[index % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {categoryData.slice(0, 5).map((item, index) => (
              <li key={item.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: palette[index % palette.length]
                  }}
                />
                {item.name} · ₹{item.value.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Insight Messaging</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            "Your biggest spending spike happens mid-month. Consider planning for it.",
            "Food expenses are trending upward. Set a mini-budget to keep it under control.",
            "You are on track to spend less than last month. Nice work!"
          ].map((text) => (
            <div
              key={text}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600"
            >
              {text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
