import { useEffect, useMemo, useState } from "react";
import { addExpense, deleteExpense, getExpenses, updateExpense } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

const categories = [
  "Food",
  "Transport",
  "Housing",
  "Education",
  "Entertainment",
  "Health",
  "Other"
];

const Expenses = () => {
  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
    query: ""
  });
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState({
    amount: "",
    category: categories[0],
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const draftKey = "sea_expense_draft";
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Expense | null>(null);

  const loadExpenses = async (page = 1, limit = meta.limit) => {
    setLoading(true);
    try {
      const res = await getExpenses({
        ...filters,
        page,
        limit
      });
      setExpenses(res.expenses);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses(1, meta.limit);
  }, [filters, meta.limit]);

  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setForm({ ...form, ...saved });
      } catch {
        return;
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!form.amount) {
        setError("Amount is required.");
        return;
      }
      await addExpense({
        amount: Number(form.amount),
        category: form.category,
        description: form.description || undefined
      });
      setForm({ amount: "", category: categories[0], description: "" });
      localStorage.removeItem(draftKey);
      await loadExpenses(1, meta.limit);
      push("Expense added", "success");
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta]);

  const sortedExpenses = useMemo(() => {
    const items = [...expenses];
    items.sort((a, b) => {
      if (sortBy === "amount") {
        return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === "category") {
        return sortDir === "asc"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      const ad = new Date(a.createdAt).getTime();
      const bd = new Date(b.createdAt).getTime();
      return sortDir === "asc" ? ad - bd : bd - ad;
    });
    return items;
  }, [expenses, sortBy, sortDir]);

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFilters({
      ...filters,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      await updateExpense(editItem.id, {
        amount: editItem.amount,
        category: editItem.category,
        description: editItem.description || undefined
      });
      push("Expense updated", "success");
      setEditItem(null);
      await loadExpenses(meta.page, meta.limit);
    } catch (err: any) {
      push(err.message || "Failed to update expense", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteExpense(deleteItem.id);
      push("Expense deleted", "success");
      setDeleteItem(null);
      await loadExpenses(meta.page, meta.limit);
    } catch (err: any) {
      push(err.message || "Failed to delete expense", "error");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Add Expense</h2>
        <p className="text-sm text-slate-500">
          Log spending instantly and keep your analytics accurate.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium">
              Amount <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="e.g. 12.50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="Optional details"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Add Expense"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Expense History</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Latest first
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search"
            value={filters.query}
            onChange={(e) =>
              setFilters({ ...filters, query: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            className="rounded-full border border-slate-200 px-3 py-1"
            onClick={() => applyQuickFilter(7)}
          >
            Last 7 days
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1"
            onClick={() => applyQuickFilter(30)}
          >
            This month
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1"
            onClick={() =>
              setFilters({ category: "", startDate: "", endDate: "", query: "" })
            }
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date" | "amount" | "category")
              }
              className="rounded-full border border-slate-200 px-3 py-1"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
            <button
              className="rounded-full border border-slate-200 px-3 py-1"
              onClick={() =>
                setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No expenses yet. Add your first spend to unlock analytics.
            </div>
          ) : (
            sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {expense.category}
                  </p>
                  <p className="text-xs text-slate-500">
                    {expense.description || "No description"}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold"
                    onClick={() => setEditItem(expense)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
                    onClick={() => setDeleteItem(expense)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Page {meta.page} of {totalPages} · {meta.total} items
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={meta.page <= 1}
              onClick={() => loadExpenses(meta.page - 1, meta.limit)}
            >
              Prev
            </button>
            <button
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={meta.page >= totalPages}
              onClick={() => loadExpenses(meta.page + 1, meta.limit)}
            >
              Next
            </button>
            <select
              value={meta.limit}
              onChange={(e) =>
                setMeta({ ...meta, limit: Number(e.target.value), page: 1 })
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}/page
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title="Edit Expense"
      >
        {editItem && (
          <div className="space-y-4">
            <input
              type="number"
              value={editItem.amount}
              onChange={(e) =>
                setEditItem({ ...editItem, amount: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={editItem.category}
              onChange={(e) =>
                setEditItem({ ...editItem, category: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <textarea
              value={editItem.description || ""}
              onChange={(e) =>
                setEditItem({ ...editItem, description: e.target.value })
              }
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <button
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              disabled={editSaving}
              onClick={handleUpdate}
            >
              {editSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        title="Delete Expense"
      >
        {deleteItem && (
          <div className="space-y-4 text-sm">
            <p>
              Delete <strong>{deleteItem.category}</strong> for{" "}
              <strong>₹{deleteItem.amount.toFixed(2)}</strong>?
            </p>
            <button
              className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;
