import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="space-y-5 stagger">

      {/* ── Profile card ─────────────────────────────────────────── */}
      <div className="card p-5 sm:p-6 animate-fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ background: "var(--lime)", color: "#080c12", fontFamily: "var(--font-display)" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {user?.name || "Student"}
            </h2>
            <p className="text-sm break-words" style={{ color: "var(--text-muted)" }}>{user?.email || ""}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              <span className="text-xs font-semibold" style={{ color: "var(--lime)" }}>Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: "Member since", value: "Feb 2026" },
            { label: "Plan", value: "Free" },
            { label: "Data", value: "Secure" },
            { label: "Version", value: "1.0.0" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two column ───────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "60ms" }}>

        {/* Preferences */}
        <div className="card p-5">
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
            🔔 Preferences
          </h3>
          <div className="space-y-3">
            {[
              { label: "Weekly summaries", desc: "Get a recap of your spending every Sunday", checked: weeklySummary, onChange: setWeeklySummary },
              { label: "Push notifications", desc: "Budget alerts and cash reminders", checked: notifications, onChange: setNotifications },
            ].map((pref) => (
              <label key={pref.label}
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 rounded-xl cursor-pointer"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div>
                  <p className="text-sm font-semibold">{pref.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{pref.desc}</p>
                </div>
                {/* Custom toggle */}
                <div
                  onClick={() => pref.onChange(!pref.checked)}
                  className="flex-shrink-0 h-6 w-11 rounded-full relative cursor-pointer transition-all self-start sm:self-auto"
                  style={{ background: pref.checked ? "var(--lime)" : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
                    style={{
                      background: pref.checked ? "#080c12" : "rgba(255,255,255,0.5)",
                      left: pref.checked ? "calc(100% - 22px)" : "2px"
                    }}
                  />
                </div>
              </label>
            ))}

            <div className="p-4 rounded-xl" style={{ background: "rgba(255,185,48,0.06)", border: "1px solid rgba(255,185,48,0.15)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--amber)" }}>📱 SMS Permission</p>
              <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(255,185,48,0.18)", color: "var(--amber)", border: "1px solid rgba(255,185,48,0.28)" }}>
                Not granted
              </span>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                SMS auto-detection requires permission on Android.
              </p>
              <button className="btn-ghost w-full sm:w-auto mt-3 text-xs py-2.5">
                Manage Permission
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-5">
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
            🔒 Security & Privacy
          </h3>
          <div className="space-y-3">
            {[
              { label: "Email verification", value: "Pending", icon: "✉️", color: "var(--amber)" },
              { label: "Data encryption", value: "AES-256", icon: "🛡️", color: "var(--lime)" },
              { label: "Data export", value: "Available", icon: "📦", color: "var(--teal)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-sm font-medium">{s.label}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <button className="btn-ghost text-sm py-3 w-full justify-center" style={{ minHeight: 44 }}>
                🔑 Change Password
              </button>
              <button className="btn-danger py-3 w-full justify-center text-sm" style={{ minHeight: 44 }}>
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger zone ──────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-up" style={{ animationDelay: "120ms", border: "1px solid rgba(255,77,109,0.15)" }}>
        <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--rose)" }}>
          ⚠️ Logout
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          You'll be signed out and redirected to the login page.
        </p>
        <button onClick={logout}
          className="btn-danger py-3 px-8 text-sm font-bold w-full sm:w-auto" style={{ minHeight: 44 }}>
          Sign out of ExpenseIQ
        </button>
      </div>
    </div>
  );
};

export default Settings;
