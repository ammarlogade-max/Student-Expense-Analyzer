import { useEffect, useState } from "react";
import { getAdminUsers } from "../../lib/adminApi";
import type { AdminUsersResponse } from "../../lib/types";

const AdminUsers = () => {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminUsers()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load users"
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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
          User Monitoring
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Users, activity, and adoption at a glance.</h2>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold">All Users</h3>
          <p className="text-sm text-slate-500">
            {data?.meta.total ?? 0} total users in the system
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Last Active</th>
                <th className="px-6 py-3 font-semibold">Device</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
                <th className="px-6 py-3 font-semibold">Expenses</th>
                <th className="px-6 py-3 font-semibold">ML Calls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4" colSpan={6}>
                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : data?.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {user.lastActive
                          ? new Date(user.lastActive).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {user.deviceType ?? "unknown"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.totalActions}</td>
                      <td className="px-6 py-4 text-slate-600">{user.expenseCount}</td>
                      <td className="px-6 py-4 text-slate-600">{user.mlRequestCount}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminUsers;
