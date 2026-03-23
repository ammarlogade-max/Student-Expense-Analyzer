import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "../../components/admin/StatCard";
import { getAdminOverview } from "../../lib/adminApi";
import type { AdminOverview } from "../../lib/types";

const AdminDashboard = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminOverview()
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load overview"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = overview
    ? [
        {
          label: "Total Users",
          value: overview.stats.totalUsers.toString(),
          hint: "Registered users across the platform"
        },
        {
          label: "Active Users",
          value: overview.stats.activeUsers.toString(),
          hint: "Seen in the last 24 hours"
        },
        {
          label: "Total Expenses",
          value: overview.stats.totalExpenses.toString(),
          hint: "All tracked expense records"
        },
        {
          label: "Conversion",
          value: `${overview.stats.conversionRate}%`,
          hint: "Users who logged at least one expense"
        },
        {
          label: "SMS Imports",
          value: overview.stats.smsImports.toString(),
          hint: "Expense imports through SMS parser"
        },
        {
          label: "ML Predictions",
          value: overview.stats.mlPredictions.toString(),
          hint: "Prediction and parse requests logged"
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 p-6 text-slate-950 shadow-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-900/60">
          Operations Snapshot
        </p>
        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
          Real product analytics for users, expenses, and ML activity.
        </h2>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))
          : cards.map((card) => <StatCard key={card.label} {...card} />)}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">7-Day Activity Volume</h3>
              <p className="text-sm text-slate-500">
                Activity events, expenses, and ML calls by day
              </p>
            </div>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  overview?.activitySeries.labels.map((label, index) => ({
                    label,
                    activity: overview.activitySeries.activity[index],
                    expenses: overview.activitySeries.expenses[index],
                    ml: overview.activitySeries.mlRequests[index]
                  })) ?? []
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activity" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="ml" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {(overview?.recentActivity ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.action.replaceAll("_", " ")}
                  </p>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.actorType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.description || item.feature || "No description"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
