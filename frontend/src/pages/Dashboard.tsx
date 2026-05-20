import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { addExpense, getCashWallet, getExpenses, getMonthlySummary, recalculateScore } from "../lib/api";
import type { Expense } from "../lib/types";
import Modal from "../components/Modal";
import FinanceScoreCard from "../components/FinanceScoreCard";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { readCache, refreshExpenseCaches, writeCache } from "../lib/swrCache";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const catEmoji: Record<string, string> = {
  Food: "🍔",
  Shopping: "🛍️",
  Transport: "🚇",
  Housing: "🏠",
  Education: "📚",
  Entertainment: "🎬",
  Health: "💊",
  Other: "📦",
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

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="card min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-tertiary)" }}>
        {title}
      </p>

      <h3 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
        {value}
      </h3>

      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
        {subtitle}
      </p>
    </div>
  );
});

const Dashboard = () => {
  useFeatureTracking("dashboard", "Viewed dashboard");

  const navigate = useNavigate();
  const { push } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [cashBalance, setCashBalance] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);

  const [quickAdd, setQuickAdd] = useState({
    amount: "",
    category: "Food",
    description: "",
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const cached = readCache<any>("dashboard:home");

    if (cached) {
      setExpenses(cached.expenses || []);
      setSummaryTotal(cached.summaryTotal || 0);
      setSummaryByCategory(cached.summaryByCategory || {});
      setCashBalance(cached.cashBalance || 0);
    }

    try {
      const [expenseData, summaryData, cashData] = await Promise.all([
        getExpenses({ limit: 5 }),
        getMonthlySummary(),
        getCashWallet(),
      ]);

      const nextData = {
        expenses: expenseData.expenses,
        summaryTotal: summaryData.summary.total,
        summaryByCategory: summaryData.summary.byCategory,
        cashBalance: cashData.wallet.balance,
      };

      setExpenses(nextData.expenses);
      setSummaryTotal(nextData.summaryTotal);
      setSummaryByCategory(nextData.summaryByCategory);
      setCashBalance(nextData.cashBalance);

      writeCache("dashboard:home", nextData);
    } catch {
      push("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const topCategories = useMemo(() => {
    return Object.entries(summaryByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [summaryByCategory]);

  const averagePerDay = useMemo(() => {
    const day = new Date().getDate();
    return day ? summaryTotal / day : 0;
  }, [summaryTotal]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  }, []);

  const handleQuickAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickAdd.amount) {
      push("Amount is required", "error");
      return;
    }

    setQuickSaving(true);

    try {
      await addExpense({
        amount: Number(quickAdd.amount),
        category: quickAdd.category,
        description: quickAdd.description || undefined,
      });

      await recalculateScore();

      refreshExpenseCaches();
      await loadDashboard();

      setQuickAdd({
        amount: "",
        category: "Food",
        description: "",
      });

      setQuickAddOpen(false);
      push("Expense added successfully", "success");
    } catch {
      push("Failed to add expense", "error");
    } finally {
      setQuickSaving(false);
    }
  }, [loadDashboard, push, quickAdd]);

  return (
    <div className="space-y-5 pb-24">
      <div>
        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
          {greeting}
        </p>

        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Monthly Spend" value={`₹${summaryTotal.toLocaleString("en-IN")}`} subtitle="This month" />
        <StatCard title="Daily Average" value={`₹${averagePerDay.toFixed(0)}`} subtitle="Average spending" />
        <StatCard title="Transactions" value={String(expenses.length)} subtitle="Recent entries" />
        <StatCard title="Cash Balance" value={`₹${cashBalance.toFixed(0)}`} subtitle="Wallet balance" />
      </div>
    </div>
  );
};

export default Dashboard;
