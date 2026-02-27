import { useEffect, useMemo, useRef, useState } from "react";
import { addExpense, deleteExpense, getExpenses, recalculateScore, updateExpense } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

// ── Constants ──────────────────────────────────────────────────────────────────
const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const catEmoji: Record<string, string> = {
  Food: "🍔", Shopping: "🛍️", Transport: "🚇", Housing: "🏠",
  Education: "📚", Entertainment: "🎬", Health: "💊", Other: "📦",
};

const catColors: Record<string, string> = {
  Food: "#c8ff00", Shopping: "#00e5c3", Transport: "#ffb930",
  Housing: "#f97316", Education: "#60a5fa", Entertainment: "#a78bfa",
  Health: "#ff4d6d", Other: "#6b7a99",
};

// ── Date helpers ───────────────────────────────────────────────────────────────
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function quickRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return { startDate: toISO(start), endDate: toISO(end) };
}
function thisMonth() {
  const now = new Date();
  return {
    startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate:   toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

// ── Icon components ────────────────────────────────────────────────────────────
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const SortIcon = ({ dir }: { dir: "asc" | "desc" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-3.5 w-3.5">
    {dir === "asc"
      ? <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>
      : <><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></>
    }
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-3.5 w-3.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── DateRangePicker dropdown ───────────────────────────────────────────────────
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (r: { startDate: string; endDate: string }) => void;
}
function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const presets = [
    { label: "Today",      fn: () => { const t = toISO(new Date()); onChange({ startDate: t, endDate: t }); setOpen(false); } },
    { label: "Last 7 days",fn: () => { onChange(quickRange(7));  setOpen(false); } },
    { label: "Last 30 days",fn: () => { onChange(quickRange(30)); setOpen(false); } },
    { label: "This month", fn: () => { onChange(thisMonth());    setOpen(false); } },
    { label: "All time",   fn: () => { onChange({ startDate: "", endDate: "" }); setOpen(false); } },
  ];

  const hasRange = startDate || endDate;
  const label = hasRange
    ? `${startDate ? fmtDate(startDate) : "Start"} → ${endDate ? fmtDate(endDate) : "End"}`
    : "Date range";

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full sm:w-auto items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-all"
        style={{
          background: hasRange ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${hasRange ? "rgba(200,255,0,0.35)" : "rgba(255,255,255,0.1)"}`,
          color: hasRange ? "var(--lime)" : "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        <CalendarIcon />
          <span className="truncate sm:max-w-[160px]">{label}</span>
        {hasRange && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange({ startDate: "", endDate: "" }); }}
            style={{ marginLeft: 2, opacity: 0.7 }}
          >
            <XIcon />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 z-50 rounded-2xl p-4 animate-scale-in"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-hi)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            width: "min(92vw, 320px)",
            left: 0,
          }}
        >
          {/* Presets */}
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Quick select</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={p.fn}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,255,0,0.1)"; e.currentTarget.style.color = "var(--lime)"; e.currentTarget.style.borderColor = "rgba(200,255,0,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>From</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChange({ startDate: e.target.value, endDate })}
                style={{ padding: "8px 10px", fontSize: 12 }}
              />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>To</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onChange({ startDate, endDate: e.target.value })}
                style={{ padding: "8px 10px", fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SortButton ─────────────────────────────────────────────────────────────────
interface SortButtonProps {
  field: "date" | "amount" | "category";
  current: "date" | "amount" | "category";
  dir: "asc" | "desc";
  onClick: () => void;
  label: string;
}
function SortButton({ field, current, dir, onClick, label }: SortButtonProps) {
  const active = field === current;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: active ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "var(--lime)" : "var(--text-muted)",
      }}
    >
      {label}
      {active && <SortIcon dir={dir} />}
    </button>
  );
}

// ── Main Expenses page ─────────────────────────────────────────────────────────
const Expenses = () => {
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "", query: "" });
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState({ amount: "", category: categories[0], description: "" });
  const [amountTouched, setAmountTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Expense | null>(null);
  const draftKey = "sea_expense_draft";
  const amountRef = useRef<HTMLInputElement>(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadExpenses = async (page = 1, limit = meta.limit) => {
    setLoading(true);
    try {
      const res = await getExpenses({ ...filters, page, limit });
      setExpenses(res.expenses);
      if (res.meta) setMeta(res.meta);
    } catch (err: any) {
      push(err.message || "Failed to load expenses", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadExpenses(1, meta.limit); }, [filters, meta.limit]);

  // Draft persistence
  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (raw) { try { setForm((f) => ({ ...f, ...JSON.parse(raw) })); } catch {} }
  }, []);
  useEffect(() => { localStorage.setItem(draftKey, JSON.stringify(form)); }, [form]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const now = new Date();
    const todayStr = toISO(now);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);

    let todayTotal = 0, weekTotal = 0, monthTotal = 0;
    const catTotals: Record<string, number> = {};

    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const dStr = toISO(d);
      if (dStr === todayStr) todayTotal += e.amount;
      if (d >= weekStart)    weekTotal  += e.amount;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
        monthTotal += e.amount;
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { todayTotal, weekTotal, monthTotal, topCat };
  }, [expenses]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      if (sortBy === "amount")   return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
      if (sortBy === "category") return sortDir === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      return sortDir === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [expenses, sortBy, sortDir]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / meta.limit)), [meta]);
  const hasActiveFilters = filters.category || filters.startDate || filters.endDate || filters.query;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountTouched(true);
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      amountRef.current?.focus();
      return;
    }
    setSaving(true); setFormError(null);
    try {
      await addExpense({ amount: Number(form.amount), category: form.category, description: form.description || undefined });
      recalculateScore().catch(console.error);
      setForm({ amount: "", category: categories[0], description: "" });
      setAmountTouched(false);
      localStorage.removeItem(draftKey);
      await loadExpenses(1, meta.limit);
      push("Expense added ✓", "success");
    } catch (err: any) {
      setFormError(err.message || "Failed to add expense");
    } finally { setSaving(false); }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      await updateExpense(editItem.id, { amount: editItem.amount, category: editItem.category, description: editItem.description || undefined });
      push("Expense updated ✓", "success");
      setEditItem(null);
      await loadExpenses(meta.page, meta.limit);
    } catch (err: any) { push(err.message || "Failed to update", "error"); }
    finally { setEditSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteExpense(deleteItem.id);
      push("Expense deleted", "success");
      setDeleteItem(null);
      await loadExpenses(meta.page, meta.limit);
    } catch (err: any) { push(err.message || "Failed to delete", "error"); }
  };

  const amountInvalid = amountTouched && (!form.amount || Number(form.amount) <= 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">

      {/* ══ LEFT: Add Expense ════════════════════════════════════════ */}
      <section className="card p-6 animate-fade-up h-fit">
        <h2 className="font-bold text-xl mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
          Add Expense
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Log spending instantly — auto-saved as draft
        </p>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Amount (₹) <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl"
                style={{ color: amountInvalid ? "var(--rose)" : "var(--text-muted)", pointerEvents: "none" }}
              >
                ₹
              </span>
              <input
                ref={amountRef}
                type="number" min="0" step="0.01"
                value={form.amount}
                onBlur={() => setAmountTouched(true)}
                onChange={(e) => { setForm({ ...form, amount: e.target.value }); if (formError) setFormError(null); }}
                placeholder="0.00"
                style={{
                  paddingLeft: 36, fontSize: 22, fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  borderColor: amountInvalid ? "var(--rose)" : undefined,
                  boxShadow: amountInvalid ? "0 0 0 3px rgba(255,77,109,0.15)" : undefined,
                }}
              />
            </div>
            {amountInvalid && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--rose)" }}>
                ↑ Enter an amount greater than ₹0
              </p>
            )}
          </div>

          {/* Category chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
              Category <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const color = catColors[cat];
                const active = form.category === cat;
                return (
                  <button
                    key={cat} type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className="cat-chip transition-all"
                    style={active ? { background: `${color}18`, borderColor: color, color, transform: "scale(1.03)" } : {}}
                  >
                    {catEmoji[cat]} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Note <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Lunch at college canteen"
              style={{ minHeight: 72, resize: "none" }}
            />
          </div>

          {/* Global form error */}
          {formError && !amountInvalid && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--rose)" }}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full"
            style={{ height: 48, fontSize: 15 }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving...
              </span>
            ) : "Add Expense →"}
          </button>
        </form>
      </section>

      {/* ══ RIGHT: History ═══════════════════════════════════════════ */}
      <section className="card p-6 animate-fade-up flex flex-col gap-5" style={{ animationDelay: "60ms" }}>

        {/* ── Summary strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today",      value: summary.todayTotal, icon: "☀️",  color: "var(--lime)" },
            { label: "This week",  value: summary.weekTotal,  icon: "📅",  color: "var(--teal)" },
            { label: "This month", value: summary.monthTotal, icon: "🗓️", color: "var(--amber)" },
            { label: "Top category", value: null, icon: catEmoji[summary.topCat || ""] || "📦", color: "var(--text-muted)", text: summary.topCat || "—" },
          ].map((s) => (
            <div key={s.label}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{s.icon}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</span>
              </div>
              <p className="font-bold text-base leading-tight" style={{ fontFamily: "var(--font-display)", color: s.color }}>
                {loading ? "—" : s.text ?? `₹${s.value!.toFixed(0)}`}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filter row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-center">
          {/* Search */}
          <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
              <SearchIcon />
            </span>
            <input
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Search by note or category…"
              className="w-full"
              style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
            />
          </div>

          {/* Category dropdown */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full"
            style={{
              padding: "9px 12px", fontSize: 13,
              borderColor: filters.category ? "rgba(200,255,0,0.35)" : undefined,
              color: filters.category ? "var(--lime)" : undefined,
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
          </select>

          {/* Date range picker */}
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={({ startDate, endDate }) => setFilters({ ...filters, startDate, endDate })}
          />

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ category: "", startDate: "", endDate: "", query: "" })}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--rose)" }}
            >
              <XIcon /> Reset filters
            </button>
          )}
        </div>

        {/* ── Sort bar + count ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium mr-1" style={{ color: "var(--text-muted)" }}>Sort:</span>
            <SortButton field="date"     current={sortBy} dir={sortDir} onClick={() => toggleSort("date")}     label="Date" />
            <SortButton field="amount"   current={sortBy} dir={sortDir} onClick={() => toggleSort("amount")}   label="Amount" />
            <SortButton field="category" current={sortBy} dir={sortDir} onClick={() => toggleSort("category")} label="Category" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.total} expense{meta.total !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtered)" : ""}
            </span>
            <select
              value={meta.limit}
              onChange={(e) => setMeta({ ...meta, limit: Number(e.target.value), page: 1 })}
              className="w-full sm:w-auto"
              style={{ padding: "6px 10px", fontSize: 12 }}
            >
              {[5, 10, 20, 50].map((s) => <option key={s} value={s}>{s} / page</option>)}
            </select>
          </div>
        </div>

        {/* ── Expense list ──────────────────────────────────────────── */}
        <div className="space-y-2 flex-1">
          {loading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[68px] rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />)
          ) : sortedExpenses.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
            >
              <span className="text-5xl mb-3">{hasActiveFilters ? "🔍" : "💸"}</span>
              <p className="font-semibold text-base mb-1">
                {hasActiveFilters ? "No expenses match your filters" : "No expenses yet"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {hasActiveFilters
                  ? "Try adjusting the search, category, or date range"
                  : "Add your first expense using the form on the left"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ category: "", startDate: "", endDate: "", query: "" })}
                  className="btn-ghost mt-4 px-5 py-2 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            sortedExpenses.map((exp, i) => {
              const color = catColors[exp.category] || "#6b7a99";
              return (
                <div
                  key={exp.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center px-4 py-3 rounded-xl transition-all animate-fade-up"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid var(--border)",
                    animationDelay: `${i * 30}ms`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {/* Category icon */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${color}15` }}
                  >
                    {catEmoji[exp.category] || "📦"}
                  </div>

                  {/* Description + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{exp.category}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                      {exp.description || <span style={{ fontStyle: "italic" }}>No note</span>}
                      <span className="mx-1.5">·</span>
                      {new Date(exp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </p>
                  </div>

                  {/* Amount — right-aligned, emphasized */}
                  <p
                    className="text-base font-black tabular-nums flex-shrink-0 sm:mx-2"
                    style={{ fontFamily: "var(--font-display)", color, minWidth: 72, textAlign: "right" }}
                  >
                    -₹{exp.amount.toLocaleString("en-IN")}
                  </p>

                  {/* Edit / Delete icon buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setEditItem(exp)}
                      title="Edit expense"
                      className="h-10 w-10 flex items-center justify-center rounded-lg transition-all"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => setDeleteItem(exp)}
                      title="Delete expense"
                      className="h-10 w-10 flex items-center justify-center rounded-lg transition-all"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.1)"; e.currentTarget.style.color = "var(--rose)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────── */}
        {meta.total > meta.limit && (
          <div
            className="flex items-center justify-between pt-4 flex-wrap gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Page <span style={{ color: "var(--text)", fontWeight: 600 }}>{meta.page}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.page <= 1}
                onClick={() => loadExpenses(meta.page - 1, meta.limit)}
                className="btn-ghost px-4 py-2 text-sm"
                style={{ opacity: meta.page <= 1 ? 0.3 : 1 }}
              >
                ← Prev
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => loadExpenses(page, meta.limit)}
                      className="h-8 w-8 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: page === meta.page ? "var(--lime)" : "rgba(255,255,255,0.05)",
                        color: page === meta.page ? "#080c12" : "var(--text-muted)",
                        border: `1px solid ${page === meta.page ? "var(--lime)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && <span style={{ color: "var(--text-muted)" }}>…</span>}
              </div>

              <button
                disabled={meta.page >= totalPages}
                onClick={() => loadExpenses(meta.page + 1, meta.limit)}
                className="btn-ghost px-4 py-2 text-sm"
                style={{ opacity: meta.page >= totalPages ? 0.3 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ══ Edit Modal ════════════════════════════════════════════════ */}
      <Modal open={Boolean(editItem)} onClose={() => setEditItem(null)} title="Edit Expense">
        {editItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Amount (₹)
              </label>
              <input
                type="number" min="0"
                value={editItem.amount}
                onChange={(e) => setEditItem({ ...editItem, amount: Number(e.target.value) })}
                style={{ fontSize: 20, fontWeight: 700 }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const color = catColors[cat];
                  return (
                    <button key={cat} type="button"
                      onClick={() => setEditItem({ ...editItem, category: cat })}
                      className="cat-chip"
                      style={editItem.category === cat
                        ? { background: `${color}18`, borderColor: color, color }
                        : {}
                      }
                    >
                      {catEmoji[cat]} {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Note
              </label>
              <textarea
                value={editItem.description || ""}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                style={{ minHeight: 72, resize: "none" }}
              />
            </div>
            <button disabled={editSaving} onClick={handleUpdate} className="btn-primary w-full" style={{ height: 48 }}>
              {editSaving ? "Saving..." : "Save Changes →"}
            </button>
          </div>
        )}
      </Modal>

      {/* ══ Delete Modal ═════════════════════════════════════════════ */}
      <Modal open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} title="Delete Expense">
        {deleteItem && (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ background: "rgba(255,77,109,0.1)" }}
              >
                🗑️
              </div>
              <p className="font-semibold text-base">Delete this expense?</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                {catEmoji[deleteItem.category]} {deleteItem.category}
                {deleteItem.description && <> · {deleteItem.description}</>}
              </p>
              <p className="text-2xl font-black mt-2" style={{ fontFamily: "var(--font-display)", color: "var(--rose)" }}>
                -₹{deleteItem.amount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>This action cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteItem(null)} className="btn-ghost" style={{ height: 44 }}>
                Keep it
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger w-full justify-center font-bold"
                style={{ height: 44, fontSize: 14 }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;
