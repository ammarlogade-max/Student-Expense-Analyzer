import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { getExpenses } from "../lib/api";
import { getBudget, getBudgetStatus, updateBudget } from "../lib/api";
import type { Expense } from "../lib/types";
import type { Budget as BudgetConfig, BudgetStatus } from "../lib/api";
import { useToast } from "../context/ToastContext";

const categories = [
  "Food", "Shopping", "Transport", "Housing",
  "Education", "Entertainment", "Health", "Other"
];

const catEmoji: Record<string, string> = {
  Food: "🍔", Shopping: "🛍️", Transport: "🚇", Housing: "🏠",
  Education: "📚", Entertainment: "🎬", Health: "💊", Other: "📦"
};

const catColors: Record<string, string> = {
  Food: "#c8ff00", Shopping: "#00e5c3", Transport: "#ffb930",
  Housing: "#f97316", Education: "#60a5fa", Entertainment: "#a78bfa",
  Health: "#ff4d6d", Other: "#6b7a99"
};

function toneColor(pct: number) {
  if (pct >= 90) return "var(--rose)";
  if (pct >= 70) return "var(--amber)";
  return "var(--lime)";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-hi)", borderRadius: 12, padding: "10px 14px" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>Day {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke, fontWeight: 700, fontSize: 14 }}>
          {p.name}: ₹{p.value}
        </p>
      ))}
    </div>
  );
};

const BudgetPage = () => {
  const { push } = useToast();
  const [budget, setBudget] = useState<BudgetConfig | null>(null);
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [limitInput, setLimitInput] = useState("");
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes, eRes] = await Promise.allSettled([
        getBudget(), getBudgetStatus(), getExpenses()
      ]);
      if (bRes.status === "fulfilled") {
        const b = bRes.value.budget;
        setBudget(b);
        setLimitInput(String(b.monthlyLimit));
        const inputs: Record<string, string> = {};
        categories.forEach((cat) => { inputs[cat] = String(b.categoryBudgets[cat] ?? 0); });
        setCategoryInputs(inputs);
      }
      if (sRes.status === "fulfilled") setStatus(sRes.value.status);
      if (eRes.status === "fulfilled") setExpenses(eRes.value.expenses);
    } catch { push("Failed to load budget", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const saveMonthlyLimit = async () => {
    const v = Number(limitInput);
    if (isNaN(v) || v < 0) { push("Enter a valid amount", "error"); return; }
    setSaving(true);
    try {
      const res = await updateBudget({ monthlyLimit: v });
      setBudget(res.budget);
      const sRes = await getBudgetStatus();
      setStatus(sRes.status);
      push("Budget saved ✓", "success");
    } catch { push("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const saveCategoryBudgets = async () => {
    const parsed: Record<string, number> = {};
    Object.entries(categoryInputs).forEach(([k, v]) => { parsed[k] = Math.max(0, Number(v) || 0); });
    setSaving(true);
    try {
      const res = await updateBudget({ categoryBudgets: parsed });
      setBudget(res.budget);
      const sRes = await getBudgetStatus();
      setStatus(sRes.status);
      push("Categories saved ✓", "success");
    } catch { push("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const { series, forecastTotal } = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyTotals = new Array(daysInMonth).fill(0);
    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        dailyTotals[d.getDate() - 1] += e.amount;
      }
    });
    let cum = 0;
    const data = dailyTotals.map((v, i) => { cum += v; return { day: i + 1, actual: Number(cum.toFixed(2)) }; });
    const today = now.getDate();
    const todayTotal = data[today - 1]?.actual ?? cum;
    const dailyAvg = today ? todayTotal / today : 0;
    const forecast = dailyAvg * daysInMonth;
    const series = data.map((p) => ({ ...p, forecast: Number((dailyAvg * p.day).toFixed(2)) }));
    return { series, forecastTotal: forecast };
  }, [expenses]);

  const limit = budget?.monthlyLimit ?? 0;
  const spent = status?.totalSpent ?? 0;
  const pct = status?.percentUsed ?? 0;
  const remaining = status?.remaining ?? 0;
  const color = toneColor(pct);

  return (
    <div className="space-y-5 stagger">

      {/* ── Overview hero ─────────────────────────────────────── */}
      <div className="card p-6 animate-fade-up" style={{
        background: "linear-gradient(135deg, rgba(200,255,0,0.07) 0%, rgba(0,229,195,0.04) 60%, var(--bg-card) 100%)",
        border: "1px solid rgba(200,255,0,0.12)"
      }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>
              Monthly Budget
            </p>
            {loading ? (
              <div className="skeleton h-12 w-40 rounded-xl" />
            ) : (
              <p className="font-black leading-none" style={{ fontFamily: "var(--font-display)", color, fontSize: "clamp(2rem, 8vw, 3rem)" }}>
                ₹{spent.toLocaleString("en-IN")}
              </p>
            )}
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              of ₹{limit.toLocaleString("en-IN")} limit
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Remaining</p>
            <p className="font-bold leading-tight" style={{ fontFamily: "var(--font-display)", color: remaining < 0 ? "var(--rose)" : "var(--lime)", fontSize: "clamp(1.375rem, 6vw, 1.875rem)" }}>
              {loading ? "—" : `₹${Math.abs(remaining).toLocaleString("en-IN")}`}
            </p>
            {remaining < 0 && <p className="text-xs mt-1" style={{ color: "var(--rose)" }}>Over budget!</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            <span>Usage</span>
            <span style={{ color }}>{pct.toFixed(1)}%</span>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}40` }} />
          </div>
        </div>

        {/* Status message */}
        {!loading && limit > 0 && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium" style={{
            background: pct >= 90 ? "rgba(255,77,109,0.08)" : pct >= 70 ? "rgba(255,185,48,0.08)" : "rgba(200,255,0,0.06)",
            border: `1px solid ${pct >= 90 ? "rgba(255,77,109,0.2)" : pct >= 70 ? "rgba(255,185,48,0.2)" : "rgba(200,255,0,0.15)"}`,
            color
          }}>
            {pct >= 90 ? "⚠️ Critical — you're nearly out of budget. Pause discretionary spending."
              : pct >= 70 ? "🟡 Getting close — keep an eye on big purchases."
              : "✅ On track! You're managing your budget well."}
          </div>
        )}
      </div>

      {/* ── Set limit + categories ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "60ms" }}>

        {/* Set monthly limit */}
        <div className="card p-5">
          <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Set Monthly Limit</h3>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Saved to your account — syncs across devices</p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Monthly limit (₹)
              </label>
              <input
                type="number" min="0"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveMonthlyLimit()}
                placeholder="e.g. 10000"
                style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}
                disabled={loading}
              />
            </div>
            <button onClick={saveMonthlyLimit} disabled={saving || loading} className="btn-primary w-full">
              {saving ? "Saving..." : "Save Budget →"}
            </button>
          </div>

          {/* 3 quick stat chips */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: "Spent", value: `₹${spent.toFixed(0)}`, color: "var(--rose)" },
              { label: "% Used", value: `${pct.toFixed(0)}%`, color },
              { label: "Forecast", value: `₹${forecastTotal.toFixed(0)}`, color: "var(--amber)" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p className="font-bold text-sm" style={{ color: s.color, fontFamily: "var(--font-display)" }}>
                  {loading ? "—" : s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category budgets */}
        <div className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Category Limits</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Set per-category spending caps</p>
            </div>
            <button onClick={saveCategoryBudgets} disabled={saving || loading} className="btn-primary w-full sm:w-auto px-4 py-2 text-xs">
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const color = catColors[cat] || "#6b7a99";
              const saved = budget?.categoryBudgets?.[cat] ?? 0;
              const catPct = status?.categoryStatus?.[cat]?.percentUsed ?? 0;
              const catSpent = status?.spentByCategory?.[cat] ?? 0;
              const isOver = status?.categoryStatus?.[cat]?.isOver;

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      {catEmoji[cat]} {cat}
                    </span>
                    {saved > 0 && (
                      <span style={{ color: isOver ? "var(--rose)" : "var(--text-muted)" }}>
                        ₹{catSpent.toFixed(0)} / ₹{saved}
                      </span>
                    )}
                  </div>
                  {saved > 0 && (
                    <div className="progress-track mb-2" style={{ height: 3 }}>
                      <div className="progress-fill" style={{ width: `${catPct}%`, background: toneColor(catPct) }} />
                    </div>
                  )}
                  <input
                    type="number" min="0"
                    value={categoryInputs[cat] ?? "0"}
                    onChange={(e) => setCategoryInputs({ ...categoryInputs, [cat]: e.target.value })}
                    className="w-full"
                    style={{ padding: "11px 12px", minHeight: 44, fontSize: 13, borderColor: saved > 0 ? `${color}40` : undefined }}
                    placeholder={`${cat} limit`}
                  />
                  {isOver && (
                    <p className="text-[11px] mt-1" style={{ color: "var(--rose)" }}>
                      ⚠️ Over by ₹{Math.abs(status?.categoryStatus?.[cat]?.remaining ?? 0).toFixed(0)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Forecast chart ────────────────────────────────────── */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Spending Forecast</h3>
            <p className="hidden sm:block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Actual vs projected based on daily average</p>
          </div>
          <div className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,185,48,0.08)", border: "1px solid rgba(255,185,48,0.2)" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Month forecast </span>
            <span className="font-bold" style={{ color: "var(--amber)" }}>₹{forecastTotal.toFixed(0)}</span>
          </div>
        </div>

        <div className="h-52 sm:h-60">
          {loading ? (
            <div className="skeleton h-full rounded-xl" />
          ) : series.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see forecast</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval={isMobile ? 4 : 1} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="actual" stroke="var(--lime)" strokeWidth={2.5} dot={false} name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke="var(--amber)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
                {limit > 0 && (
                  <ReferenceLine y={limit} stroke="var(--rose)" strokeDasharray="4 4"
                    label={{ value: "Limit", fill: "var(--rose)", fontSize: 11, position: "right" }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="block sm:hidden text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Actual vs projected based on daily average
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-5 rounded" style={{ background: "var(--lime)" }} /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-5 rounded" style={{ background: "var(--amber)", opacity: 0.7 }} /> Forecast
          </span>
          {limit > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-5 rounded" style={{ background: "var(--rose)" }} /> Budget limit
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
