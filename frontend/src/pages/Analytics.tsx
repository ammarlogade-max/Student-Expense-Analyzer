import { useEffect, useMemo, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const palette = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6", "#f97316", "#a78bfa"];

const Analytics = () => {
  useFeatureTracking("analytics", "Viewed analytics");
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [activeTab, setActiveTab] = useState<"trend" | "category" | "insights">("trend");

  const exportCsv = () => {
    if (!expenses.length) {
      push("No data", "error");
      return;
    }

    const csv = [
      "category,amount,date",
      ...expenses.map((e) => `${e.category},${e.amount},${new Date(e.createdAt).toISOString()}`),
    ].join("\n");

    const anchor = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `expenses_${new Date().toISOString().slice(0, 10)}.csv`,
    });

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    push("Exported", "success");
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([getExpenses(range.startDate || range.endDate ? range : undefined), getMonthlySummary()])
      .then(([eRes, sRes]) => {
        if (!active) return;
        setExpenses(eRes.expenses);
        setSummaryByCategory(sRes.summary.byCategory);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range]);

  const categoryData = useMemo(
    () =>
      Object.entries(summaryByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [summaryByCategory]
  );

  const totalSpend = useMemo(() => categoryData.reduce((sum, d) => sum + d.value, 0), [categoryData]);

  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + e.amount);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month: month.slice(5), total }));
  }, [expenses]);

  const tabStyle = (tab: string) =>
    activeTab === tab
      ? { background: "var(--gradient-primary)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }
      : { background: "transparent", color: "var(--text-secondary)" };

  return (
    <div className="space-y-4 stagger">
      <div className="hero-gradient">
        <div className="relative z-10">
          <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
            Analytics
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Insights from your spending
          </h1>
          <p className="mt-2 max-w-lg text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
            Track category trends, monthly patterns, and financial behavior across all your transactions.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap gap-3">
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              From date
            </label>
            <input
              type="date"
              value={range.startDate}
              onChange={(e) => setRange({ ...range, startDate: e.target.value })}
              style={{ minHeight: 44, fontSize: 16 }}
              aria-label="Start date"
            />
          </div>
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              To date
            </label>
            <input
              type="date"
              value={range.endDate}
              onChange={(e) => setRange({ ...range, endDate: e.target.value })}
              style={{ minHeight: 44, fontSize: 16 }}
              aria-label="End date"
            />
          </div>
          {(range.startDate || range.endDate) && (
            <button
              onClick={() => setRange({ startDate: "", endDate: "" })}
              className="btn-ghost shrink-0 !px-3 !py-2 text-xs"
              style={{ color: "var(--error)", borderColor: "rgba(239,68,68,0.3)" }}
            >
              Clear
            </button>
          )}
          <button onClick={exportCsv} className="btn-primary shrink-0 !px-3 !py-2 text-xs" aria-label="Export analytics as CSV">
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Total Spend", v: `₹${totalSpend.toLocaleString("en-IN")}`, c: "var(--primary)" },
            { l: "Categories", v: String(categoryData.length), c: "var(--accent)" },
            { l: "Entries", v: String(expenses.length), c: "var(--warning)" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {s.l}
              </p>
              <p className="mt-0.5 text-base font-bold" style={{ color: s.c }}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar">
        {[
          { id: "trend", label: "Trend" },
          { id: "category", label: "Category" },
          { id: "insights", label: "Insights" },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)} className="tab-item" style={tabStyle(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "trend" && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Monthly Spending Trend
          </h3>
          {loading ? (
            <div className="skeleton h-56" />
          ) : monthlySeries.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center" style={{ border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-lg)" }}>
              <span className="mb-2 text-3xl">📈</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Add expenses to see trends
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <YAxis
                    stroke="rgba(255,255,255,0.15)"
                    tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                    width={52}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-medium)",
                      borderRadius: 12,
                      color: "var(--text-primary)",
                    }}
                    formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Spend"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "var(--bg-primary)" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === "category" && (
        <div className="space-y-4">
          {loading ? (
            <div className="skeleton h-64" />
          ) : categoryData.length === 0 ? (
            <div className="card flex h-64 flex-col items-center justify-center">
              <span className="mb-2 text-3xl">🥧</span>
              <p style={{ color: "var(--text-secondary)" }}>No data yet</p>
            </div>
          ) : (
            <>
              <div className="card flex items-center justify-center">
                <div className="h-52 w-52 sm:h-60 sm:w-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={palette[i % palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-medium)",
                          borderRadius: 12,
                          color: "var(--text-primary)",
                        }}
                        formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                {categoryData.map((item, i) => {
                  const pct = totalSpend > 0 ? (item.value / totalSpend) * 100 : 0;
                  const color = palette[i % palette.length];

                  return (
                    <div key={item.name} className="card !p-3.5">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.name}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-sm font-bold" style={{ color }}>
                          ₹{item.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-3">
          {[
            {
              icon: "🎯",
              title: "Mid-month spending spike",
              text: "Your biggest purchases usually cluster around the 12th-18th. Pre-budget for this window.",
            },
            {
              icon: "🍔",
              title: "Food is your top category",
              text: "Food expenses are consistently your largest spend. A ₹50/day cap can save ₹1,500/month.",
            },
            {
              icon: "🏆",
              title: "Great consistency streak",
              text: "Logging daily for 7+ days unlocks the Consistency sub-score boost - keep it up!",
            },
          ].map((item) => (
            <div key={item.title} className="insight-card">
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-xl">{item.icon}</span>
                <div>
                  <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;
