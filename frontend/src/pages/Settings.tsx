import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Settings
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
          Trust, privacy, and personalization.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Update profile details, manage security preferences, and switch
          accounts if needed.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Profile</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Name
              </p>
              <p className="text-base font-semibold text-slate-800">
                {user?.name || "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Email
              </p>
              <p className="text-base font-semibold text-slate-800">
                {user?.email || "Unknown"}
              </p>
            </div>
          </div>
          <button
            className="mt-6 w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Preferences</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              Weekly summaries
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => setWeeklySummary(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              Notifications
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </label>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              SMS parser permission: Not granted.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Security & Privacy</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Email verification
            </p>
            <p className="text-sm font-semibold text-slate-800">
              Pending
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Data export
            </p>
            <p className="text-sm font-semibold text-slate-800">
              Available on request
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
            Change Password
          </button>
          <button className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            Delete Account
          </button>
        </div>
      </section>

    </div>
  );
};

export default Settings;
