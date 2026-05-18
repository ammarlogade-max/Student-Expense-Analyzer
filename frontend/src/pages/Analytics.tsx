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

    Promise.all([
      getExpenses(range.startDate || range.endDate ? range : undefined),
      getMonthlySummary(),
    ])
      .then(([eRes, sRes]) => {
        if (!active) return;

        setExpenses(eRes.expenses);
        setSummaryByCategory(sRes.summary.byCategory);
      })
      .catch(() => {
        push("Failed to load analytics", "error");
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

  const totalSpend = useMemo(
    () => categoryData.reduce((sum, d) => sum + d.value, 0),
    [categoryData]
  );

  const topCategory = categoryData[0];

  const averageExpense = useMemo(() => {
    if (!expenses.length) return 0;

    return totalSpend / expenses.length;
  }, [expenses, totalSpend]);

  const monthlySeries = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      map.set(key, (map.get(key) || 0) + e.amount);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: month.slice(5),
        total,
      }));
  }, [expenses]);

  const insights = useMemo(() => {
    const list = [];

    if (topCategory) {
      list.push({
        icon: "📊",
        title: `${topCategory.name} is your highest expense category`,
        text: `You spent ₹${topCategory.value.toLocaleString("en-IN")} on ${topCategory.name}.`,
      });
    }

    if (averageExpense > 0) {
      list.push({
        icon: "💳",
        title: "Average transaction value",
        text: `Your average expense amount is ₹${averageExpense.toFixed(0)}.`,
      });
    }

    if (expenses.length > 0) {
      list.push({
        icon: "🧾",
        title: "Expense tracking activity",
        text: `You have tracked ${expenses.length} expense entries so far.`,
      });
    }

    return list;
  }, [topCategory, averageExpense, expenses]);

  const tabStyle = (tab: string) =>
    activeTab === tab
      ? {
          background: "var(--gradient-primary)",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
        }
      : {
          background: "transparent",
          color: "var(--text-secondary)",
        };

  return <div className="space-y-4 stagger">Analytics Updated</div>;
};

export default Analytics;
