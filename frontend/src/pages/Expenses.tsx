import { useEffect, useMemo, useState } from "react";
import { deleteExpense, getExpenses, updateExpense } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { readCache, writeCache } from "../lib/swrCache";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];
const catEmoji: Record<string, string> = {
  Food: "\u{1F354}",
  Shopping: "\u{1F6CD}\uFE0F",
  Transport: "\u{1F687}",
  Housing: "\u{1F3E0}",
  Education: "\u{1F4DA}",
  Entertainment: "\u{1F3AC}",
  Health: "\u{1F48A}",
  Other: "\u{1F4E6}",
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

const Expenses = () => {
  const { push } = useToast();
  const { addExpense: addExpenseOffline } = useOfflineQueue();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "", query: "" });
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState({ amount: "", category: categories[0], description: "" });
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Expense | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = async (page = 1, limit = meta.limit) => {
    const cacheKey = `expenses:${JSON.stringify({ filters, page, limit })}`;
    const cached = readCache<{ expenses: Expense[]; meta: { total: number; page: number; limit: number } }>(cacheKey);

    if (cached) {
      setExpenses(cached.expenses);
      setMeta(cached.meta);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await getExpenses({ ...filters, page, limit });
      setExpenses(res.expenses);
      if (res.meta) setMeta(res.meta);
      writeCache(cacheKey, {
        expenses: res.expenses,
        meta: res.meta ?? { total: res.expenses.length, page, limit },
      });
    } catch {
      push("Failed to load", "error");
    }

    setLoading(false);
  };

  useEffect(() => {
    void load(1, meta.limit);
  }, [filters, meta.limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    const note = form.description.trim();

    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      push("Amount must be greater than 0", "error");
      return;
    }
    if (note.length > 200) {
      push("Note must be 200 characters or less", "error");
      return;
    }

    setSaving(true);
    try {
      await addExpenseOffline({ amount, category: form.category, description: note || undefined });
      setForm({ amount: "", category: categories[0], description: "" });
      setAddOpen(false);
      await load(1, meta.limit);
      push("Expense added", "success");
    } catch (err: any) {
      push(err.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setEditSaving(true);

    try {
      if (!editItem.amount || Number.isNaN(editItem.amount) || editItem.amount <= 0) {
        push("Amount must be greater than 0", "error");
        setEditSaving(false);
        return;
      }
      if ((editItem.description || "").trim().length > 200) {
        push("Note must be 200 characters or less", "error");
        setEditSaving(false);
        return;
      }

      await updateExpense(editItem.id, {
        amount: editItem.amount,
        category: editItem.category,
        description: editItem.description?.trim() || undefined,
      });

      push("Updated", "success");
      setEditItem(null);
      await load(meta.page, meta.limit);
    } catch (err: any) {
      push(err.message || "Failed", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteExpense(deleteItem.id);
      push("Deleted", "success");
      setDeleteItem(null);
      await load(meta.page, meta.limit);
    } catch (err: any) {
      push(err.message || "Failed", "error");
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / meta.limit)), [meta]);
  const sorted = useMemo(
    () =>
      [...expenses].sort((a, b) => {
        if (sortBy === "amount") return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
        if (sortBy === "category") return sortDir === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
        return sortDir === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [expenses, sortBy, sortDir]
  );

  return (
    <div className="space-y-4 stagger">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Expenses
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {meta.total} total entries
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary shrink-0 px-4 py-2.5 text-sm" style={{ minHeight: 40 }}>
          + Add Expense
        </button>
      </div>

      <div className="card !p-3">
        <div className="flex gap-2">
          <input value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} placeholder="Search expenses..." style={{ flex: 1 }} />
          <button
            onClick={() => setFiltersOpen((x) => !x)}
            className={`btn-ghost px-3 text-xs gap-1.5 shrink-0 ${filtersOpen ? "!border-[var(--primary)] !text-[var(--primary)]" : ""}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border-light)" }}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
              <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split("-");
                  setSortBy(s as any);
                  setSortDir(d as any);
                }}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Highest amount</option>
                <option value="amount-asc">Lowest amount</option>
                <option value="category-asc">Category A-Z</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                [7, "7 days"],
                [30, "This month"],
              ].map(([d, l]) => (
                <button
                  key={String(l)}
                  onClick={() => {
                    const e = new Date();
                    const s = new Date();
                    s.setDate(e.getDate() - Number(d));
                    setFilters({ ...filters, startDate: s.toISOString().slice(0, 10), endDate: e.toISOString().slice(0, 10) });
                  }}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  {l}
                </button>
              ))}
              <button
                onClick={() => setFilters({ category: "", startDate: "", endDate: "", query: "" })}
                className="btn-ghost px-3 py-1.5 text-xs"
                style={{ color: "var(--error)", borderColor: "rgba(239,68,68,0.25)" }}
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[68px]" />)
        ) : sorted.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🧾</span>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              No expenses found
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Try adjusting your filters or add a new expense
            </p>
          </div>
        ) : (
          sorted.map((exp) => {
            const color = catColors[exp.category] || "#94a3b8";
            const rowNote = `${exp.description || "No note"} · ${new Date(exp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
            return (
              <div key={exp.id} className="expense-row">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                  {catEmoji[exp.category] || "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {exp.category}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }} title={rowNote}>
                    {rowNote}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 sm:flex-row sm:items-center sm:gap-2">
                  <p className="text-sm font-bold tabular-nums" style={{ color }}>
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditItem(exp)} className="btn-ghost !px-2 !py-1.5 text-xs !min-h-[34px]">
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteItem(exp)}
                      className="btn-ghost !px-2 !py-1.5 text-xs !min-h-[34px]"
                      style={{ color: "var(--error)", borderColor: "rgba(239,68,68,0.25)" }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {meta.total > meta.limit && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Page {meta.page}/{totalPages} · {meta.total} items
          </p>
          <div className="flex gap-2">
            <button disabled={meta.page <= 1} onClick={() => load(meta.page - 1, meta.limit)} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">
              ← Prev
            </button>
            <button disabled={meta.page >= totalPages} onClick={() => load(meta.page + 1, meta.limit)} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: "var(--text-tertiary)" }}>
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              style={{ paddingLeft: 36, fontSize: 20, fontWeight: 700 }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const color = catColors[cat];
              const active = form.category === cat;
              return (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} className="cat-chip" style={active ? { background: `${color}18`, borderColor: color, color } : {}}>
                  {catEmoji[cat]} {cat}
                </button>
              );
            })}
          </div>
          <textarea rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note (optional, max 200 chars)" style={{ resize: "none" }} />
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : "Add Expense →"}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(editItem)} onClose={() => setEditItem(null)} title="Edit Expense">
        {editItem && (
          <div className="space-y-3">
            <input type="number" value={editItem.amount} onChange={(e) => setEditItem({ ...editItem, amount: Number(e.target.value) })} />
            <select value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea rows={2} maxLength={200} value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} style={{ resize: "none" }} />
            <button disabled={editSaving} onClick={handleUpdate} className="btn-primary w-full">
              {editSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} title="Delete Expense">
        {deleteItem && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Delete <strong style={{ color: "var(--text-primary)" }}>{deleteItem.category}</strong> · ₹{deleteItem.amount.toLocaleString("en-IN")}?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteItem(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-primary flex-1" style={{ background: "var(--error)", boxShadow: "none" }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;
