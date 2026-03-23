import { useEffect, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getAdminActivity, getAdminOverview } from "../../lib/adminApi";
import type { AdminActivityResponse, AdminOverview } from "../../lib/types";

const colors = ["#06b6d4", "#0f766e", "#2563eb", "#14b8a6", "#f59e0b", "#ef4444"];

const AdminAnalytics = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivityResponse | null>(null);

  useEffect(() => {
    Promise.all([getAdminOverview(), getAdminActivity()]).then(([overviewData, activityData]) => {
      setOverview(overviewData);
      setActivity(activityData);
    });
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Analytics
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Conversion, feature usage, and event flow.</h2>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Feature Usage</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview?.featureUsage ?? []}
                  dataKey="count"
                  nameKey="feature"
                  innerRadius={70}
                  outerRadius={100}
                >
                  {(overview?.featureUsage ?? []).map((entry, index) => (
                    <Cell
                      key={entry.feature ?? index}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Expense Category Distribution</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview?.expenseCategories ?? []}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#0f766e"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Activity Breakdown</h3>
          <div className="mt-4 space-y-3">
            {(activity?.summary ?? []).map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="font-medium text-slate-700">
                  {item.action.replaceAll("_", " ")}
                </span>
                <span className="text-sm text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Event Stream</h3>
          <div className="mt-4 space-y-3">
            {(activity?.logs ?? []).slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.user?.name ?? item.admin?.name ?? "System"}
                </p>
                <p className="text-sm text-slate-600">
                  {item.action.replaceAll("_", " ")} {item.feature ? `on ${item.feature}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-400">
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

export default AdminAnalytics;
