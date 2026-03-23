import { useEffect, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { getAdminSystem } from "../../lib/adminApi";
import type { AdminSystemResponse } from "../../lib/types";

const AdminSystem = () => {
  const [data, setData] = useState<AdminSystemResponse | null>(null);

  useEffect(() => {
    getAdminSystem().then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">
          System Health
        </p>
        <h2 className="mt-2 text-3xl font-semibold">API runtime, service health, and operational reliability.</h2>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests"
          value={String(data?.system.runtime.requestCount ?? 0)}
          hint="Requests handled since boot"
        />
        <StatCard
          label="Errors"
          value={String(data?.system.runtime.errorCount ?? 0)}
          hint="Tracked API failures"
        />
        <StatCard
          label="Avg API Latency"
          value={`${Math.round(data?.system.runtime.averageResponseTimeMs ?? 0)} ms`}
          hint="Mean response time"
        />
        <StatCard
          label="P95 Latency"
          value={`${Math.round(data?.system.runtime.p95ResponseTimeMs ?? 0)} ms`}
          hint="95th percentile response time"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Service Status</h3>
          <div className="mt-4 space-y-3">
            {[
              {
                name: "Database",
                status: data?.system.services.database.status,
                time: data?.system.services.database.responseTimeMs
              },
              {
                name: "ML Service",
                status: data?.system.services.ml.status,
                time: data?.system.services.ml.responseTimeMs
              }
            ].map((service) => (
              <div
                key={service.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      service.status === "healthy"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {service.status ?? "unknown"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Response time: {service.time ?? 0} ms
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recent Requests</h3>
          <div className="mt-4 space-y-3">
            {(data?.system.runtime.recentRequests ?? []).map((request, index) => (
              <div
                key={`${request.path}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {request.method} {request.path}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{request.statusCode}</p>
                  <p className="text-xs text-slate-400">{request.durationMs} ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSystem;
