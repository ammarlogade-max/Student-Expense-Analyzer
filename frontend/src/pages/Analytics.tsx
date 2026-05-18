import { useEffect, useMemo, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getExpenses, getMonthlySummary } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const palette = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6"];

const Analytics = () => {
  useFeatureTracking("analytics", "Viewed analytics");

  const { push } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaryByCategory, setSummaryByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trend" | "category" | "insights">("trend");

  useEffect(() => {
    let active = true;

    Promise.all([getExpenses(), getMonthlySummary()])
      .then(([expenseRes, summaryRes]) => {
        if (!active) return;

        setExpenses(expenseRes.expenses || []);
        setSummaryByCategory(summaryRes.summary.byCategory || {});
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
  }, []);

  const categoryData = useMemo(() => {
    return Object.entries(summaryByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [summaryByCategory]);

  const totalSpend = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.value, 0);
  }, [categoryData]);

  const monthlySeries = useMemo(() => {
    const grouped = new Map<string, number>();

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;

      grouped.set(key, (grouped.get(key) || 0) + expense.amount);
    });

    return Array.from(grouped.entries()).map(([month, total]) => ({
      month,
      total,
    }));
  }, [expenses]);

  const insights = useMemo(() => {
    const topCategory = categoryData[0];

    return [
      topCategory
        ? {
            title: "Highest spending category",
            text: `${topCategory.name} contributes the highest expense with ₹${topCategory.value.toLocaleString("en-IN")}.`,
          }
        : null,
      {
        title: "Tracked expenses",
        text: `${expenses.length} expenses have been tracked in the system.`,
      },
      {
        title: "Average transaction",
        text: expenses.length
          ? `Average expense amount is ₹${(totalSpend / expenses.length).toFixed(0)}.`
          : "No expense data available yet.",
      },
    ].filter(Boolean);
  }, [categoryData, expenses, totalSpend]);

  return (
    <div className="space-y-5 pb-24 stagger">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Analytics
        </h1>

        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Visualize spending patterns and financial activity.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Total Spend
          </p>

          <h3 className="text-lg font-bold mt-2" style={{ color: "var(--primary)" }}>
            ₹{totalSpend.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="card text-center">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Categories
          </p>

          <h3 className="text-lg font-bold mt-2" style={{ color: "var(--accent)" }}>
            {categoryData.length}
          </h3>
        </div>

        <div className="card text-center">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Transactions
          </p>

          <h3 className="text-lg font-bold mt-2" style={{ color: "var(--warning)" }}>
            {expenses.length}
          </h3>
        </div>
      </div>

      <div className="tab-bar">
        {[
          { id: "trend", label: "Trend" },
          { id: "category", label: "Category" },
          { id: "insights", label: "Insights" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "trend" && (
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Monthly Trend</h2>

          {loading ? (
            <div className="skeleton h-56" />
          ) : monthlySeries.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm">
              No trend data available
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === "category" && (
        <div className="space-y-4">
          <div className="card flex items-center justify-center">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius="80%">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {categoryData.map((item, index) => (
            <div key={item.name} className="card !p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: palette[index % palette.length] }}
                  />

                  <span>{item.name}</span>
                </div>

                <span className="font-semibold">
                  ₹{item.value.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-3">
          {insights.map((item: any) => (
            <div key={item.title} className="card">
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;
