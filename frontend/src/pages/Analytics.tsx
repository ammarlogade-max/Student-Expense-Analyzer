import { useEffect, useMemo, useState } from "react";
import {
  Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";

const palette = ["#c8ff00", "#00e5c3", "#ffb930", "#ff4d6d", "#a78bfa", "#60a5fa"];

const catEmoji: Record<string, string> = {
  Food: "🍔", Shopping: "🛍️", Transport: "🚇", Health: "💊",
  Entertainment: "🎬", Education: "📚", Housing: "🏠", Other: "📦"
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-hi)", borderRadius: 12, padding: "10px 14px" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: "var(--lime)", fontWeight: 700, fontSize: 15 }}>₹{payload[0].value?.toFixed(0)}</p>
    </div>
  );
};

const Analytics = () => {
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [compareMode, setCompareMode] = useState<"none" | "prev">("prev");
  const [compareDelta, setCompareDelta] = useState<number | null>(null);

  const handleExportCsv = () => {
    if (!expenses.length) { push("No data to export", "error"); return; }
    const header = ["category", "amount", "date"];
    const rows = expenses.map((item) => [
      item.category,
      item.amount,
      new Date(item.createdAt).toISOString()
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    push("CSV downloaded ✓", "success");
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [expRes, sumRes] = await Promise.all([
          getExpenses(range.startDate || range.endDate ? range : undefined),
          getMonthlySummary()
        ]);
        if (!active) return;
        setExpenses(expRes.expenses);
        setSummaryByCategory(sumRes.summary.byCategory);
      } catch (err: any) {
        if (!active) return;
        push(err.message || "Failed to load analytics data", "error");
        setExpenses([]);
        setSummaryByCategory({});
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [range, push]);

  useEffect(() => {
    if (!range.startDate || !range.endDate || compareMode === "none") { setCompareDelta(null); return; }
    const start = new Date(range.startDate), end = new Date(range.endDate);
    const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - diff);
    getExpenses({ startDate: prevStart.toISOString().slice(0, 10), endDate: prevEnd.toISOString().slice(0, 10) })
      .then((res) => {
        const prev = res.expenses.reduce((s, e) => s + e.amount, 0);
        const curr = expenses.reduce((s, e) => s + e.amount, 0);
        setCompareDelta(curr - prev);
      }).catch(() => setCompareDelta(null));
  }, [range, compareMode, expenses]);

  const categoryData = useMemo(() =>
    Object.entries(summaryByCategory).map(([name, value]) => ({ name, value })),
    [summaryByCategory]
  );

  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + e.amount);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }, [expenses]);

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const avgPerTx = expenses.length ? totalSpend / expenses.length : 0;
  const topCat = categoryData.sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-5 stagger">

      {/* ── Stats strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-up">
        {[
          { label: "Total Spent", value: `₹${totalSpend.toFixed(0)}`, icon: "💳", color: "var(--lime)" },
          { label: "Avg Per Tx", value: `₹${avgPerTx.toFixed(0)}`, icon: "📊", color: "var(--teal)" },
          { label: "Top Category", value: topCat?.name || "—", icon: catEmoji[topCat?.name || ""] || "📦", color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xl mb-2">{s.icon}</p>
            <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-display)", color: s.color }}>
              {loading ? "—" : s.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_240px_auto] lg:items-center lg:gap-3">
          <div className="flex items-center gap-2 min-w-0 sm:col-span-2 lg:col-span-1">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-semibold">Filter</span>
          </div>
          <input type="date" value={range.startDate}
            onChange={(e) => setRange({ ...range, startDate: e.target.value })}
            className="w-full sm:w-auto"
            style={{ padding: "8px 12px", fontSize: 13 }}
          />
          <input type="date" value={range.endDate}
            onChange={(e) => setRange({ ...range, endDate: e.target.value })}
            className="w-full sm:w-auto"
            style={{ padding: "8px 12px", fontSize: 13 }}
          />
          <select value={compareMode} onChange={(e) => setCompareMode(e.target.value as "none" | "prev")}
            className="w-full sm:w-auto"
            style={{ padding: "8px 12px", fontSize: 13 }}
          >
            <option value="prev">Compare previous period</option>
            <option value="none">No comparison</option>
          </select>
          <button onClick={handleExportCsv} className="btn-ghost w-full sm:w-auto px-4 py-2 text-xs">
            ↓ Export CSV
          </button>
        </div>

        {compareDelta !== null && (
          <div
            className="mt-3 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: compareDelta >= 0 ? "rgba(255,77,109,0.08)" : "rgba(200,255,0,0.08)",
              border: `1px solid ${compareDelta >= 0 ? "rgba(255,77,109,0.2)" : "rgba(200,255,0,0.2)"}`,
              color: compareDelta >= 0 ? "var(--rose)" : "var(--lime)"
            }}
          >
            {compareDelta >= 0
              ? `📈 Spending up ₹${compareDelta.toFixed(0)} vs previous period`
              : `📉 Spending down ₹${Math.abs(compareDelta).toFixed(0)} vs previous period — great work!`}
          </div>
        )}
      </div>

      {/* ── Charts row ─────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] animate-fade-up" style={{ animationDelay: "120ms" }}>

        {/* Line chart */}
        <div className="card p-5 min-w-0">
          <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Monthly Spending Trend
          </h3>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Total spent per month</p>
          <div className="h-56">
            {loading ? (
              <div className="skeleton h-full rounded-xl" />
            ) : monthlySeries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center rounded-xl"
                style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-3xl mb-2">📈</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see trendlines</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="var(--lime)" strokeWidth={3} dot={{ fill: "var(--lime)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut chart */}
        <div className="card p-5 min-w-0">
          <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Category Share
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>This month's breakdown</p>
          <div className="h-44">
            {loading ? (
              <div className="skeleton h-full rounded-xl" />
            ) : categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center rounded-xl"
                style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-3xl mb-2">🍩</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={palette[i % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value ?? 0).toFixed(0)}`}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-hi)", borderRadius: 12 }}
                    labelStyle={{ color: "var(--text-muted)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {categoryData.slice(0, 4).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: palette[i % palette.length] }} />
                  <span style={{ color: "var(--text-muted)" }}>{catEmoji[item.name] || "📦"} {item.name}</span>
                </div>
                <span className="font-semibold">₹{item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Insights ────────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
          💡 Spending Insights
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: "📅", text: "Your biggest spending spike happens mid-month. Consider planning for it.", color: "var(--amber)" },
            { icon: "🍔", text: "Food expenses are trending upward. Set a mini-budget to keep it under control.", color: "var(--rose)" },
            { icon: "✅", text: "You are on track to spend less than last month. Nice work!", color: "var(--lime)" },
          ].map((insight) => (
            <div
              key={insight.text}
              className="p-4 rounded-2xl text-sm leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <span className="text-xl block mb-2">{insight.icon}</span>
              {insight.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
