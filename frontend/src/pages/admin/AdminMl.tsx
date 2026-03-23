import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "../../components/admin/StatCard";
import { getAdminMl } from "../../lib/adminApi";
import type { AdminMlResponse } from "../../lib/types";

const AdminMl = () => {
  const [data, setData] = useState<AdminMlResponse | null>(null);

  useEffect(() => {
    getAdminMl().then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-violet-900 via-blue-900 to-cyan-900 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
          ML Insights
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Prediction quality, latency, and category output.</h2>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Predictions"
          value={String(data?.stats.totalPredictions ?? 0)}
          hint="All ML requests logged"
        />
        <StatCard
          label="Success Rate"
          value={`${data?.stats.successRate ?? 0}%`}
          hint="Successful predictions and SMS parses"
        />
        <StatCard
          label="Avg Latency"
          value={`${Math.round(data?.stats.averageResponseTimeMs ?? 0)} ms`}
          hint="Average response time for ML requests"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Predicted Categories</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.categories ?? []}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent ML Requests</h3>
          <div className="mt-4 space-y-3">
            {(data?.logs ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.requestType.replaceAll("_", " ")}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.success
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.success ? "Success" : "Failed"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.merchant || "Unknown merchant"} {"->"} {item.category || "No category"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.responseTimeMs} ms
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminMl;
