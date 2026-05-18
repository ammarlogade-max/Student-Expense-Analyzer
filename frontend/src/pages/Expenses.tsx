import { useEffect, useMemo, useState } from "react";
import { deleteExpense, getExpenses, updateExpense } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { readCache, writeCache } from "../lib/swrCache";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const Expenses = () => {
  useFeatureTracking("expenses", "Viewed expenses");

  const { push } = useToast();
  const { addExpense: addExpenseOffline } = useOfflineQueue();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
    query: "",
  });

  const [form, setForm] = useState({
    amount: "",
    category: categories[0],
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [deleteItem, setDeleteItem] = useState<Expense | null>(null);

  const loadExpenses = async () => {
    setLoading(true);
    setError("");

    const cacheKey = `expenses:${JSON.stringify(filters)}`;
    const cached = readCache<any>(cacheKey);

    if (cached) {
      setExpenses(cached.expenses || []);
      setMeta(cached.meta || meta);
    }

    try {
      const response = await getExpenses(filters);

      setExpenses(response.expenses || []);

      if (response.meta) {
        setMeta(response.meta);
      }

      writeCache(cacheKey, {
        expenses: response.expenses,
        meta: response.meta,
      });
    } catch {
      setError("Failed to load expenses");
      push("Unable to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [filters]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      push("Enter a valid amount", "error");
      return;
    }

    setSaving(true);

    try {
      await addExpenseOffline({
        amount,
        category: form.category,
        description: form.description || undefined,
      });

      push("Expense added", "success");

      setForm({
        amount: "",
        category: categories[0],
        description: "",
      });

      setAddOpen(false);
      await loadExpenses();
    } catch {
      push("Failed to add expense", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;

    setEditSaving(true);

    try {
      await updateExpense(editItem.id, {
        amount: editItem.amount,
        category: editItem.category,
        description: editItem.description || undefined,
      });

      push("Expense updated", "success");
      setEditItem(null);
      await loadExpenses();
    } catch {
      push("Failed to update expense", "error");
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
      await loadExpenses();
    } catch {
      push("Failed to delete expense", "error");
    }
  };

  return (
    <div className="space-y-5 pb-24 stagger">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            Expenses
          </h1>

          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {meta.total} total entries
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="btn-primary"
        >
          + Add
        </button>
      </div>

      <div className="card !p-4 space-y-3">
        <input
          value={filters.query}
          onChange={(e) =>
            setFilters({
              ...filters,
              query: e.target.value,
            })
          }
          placeholder="Search expenses"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: e.target.value,
              })
            }
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
              setFilters({
                ...filters,
                startDate: e.target.value,
              })
            }
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                endDate: e.target.value,
              })
            }
          />

          <button
            onClick={() =>
              setFilters({
                category: "",
                startDate: "",
                endDate: "",
                query: "",
              })
            }
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-[72px]" />
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-10 space-y-4">
          <p className="text-sm" style={{ color: "var(--error)" }}>
            {error}
          </p>

          <button onClick={loadExpenses} className="btn-secondary">
            Retry
          </button>
        </div>
      ) : sortedExpenses.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No expenses found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExpenses.map((expense) => (
            <div key={expense.id} className="expense-row">
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {expense.category}
                </p>

                <p
                  className="text-xs mt-1 truncate"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {expense.description || "No description"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold">
                  ₹{expense.amount.toLocaleString("en-IN")}
                </p>

                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={() => setEditItem(expense)}
                    className="btn-ghost text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteItem(expense)}
                    className="btn-ghost text-xs"
                    style={{ color: "var(--error)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            placeholder="Amount"
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            placeholder="Description"
          />

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? "Saving..." : "Add Expense"}
          </button>
        </form>
      </Modal>

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
                setEditItem({
                  ...editItem,
                  amount: Number(e.target.value),
                })
              }
            />

            <select
              value={editItem.category}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  category: e.target.value,
                })
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <textarea
              rows={3}
              value={editItem.description || ""}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  description: e.target.value,
                })
              }
            />

            <button
              onClick={handleUpdate}
              disabled={editSaving}
              className="btn-primary w-full"
            >
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Are you sure you want to delete this expense?
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setDeleteItem(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              className="btn-primary flex-1"
              style={{ background: "var(--error)" }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
