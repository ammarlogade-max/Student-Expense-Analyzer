import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ChevronRight() { return <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 ml-auto" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>; }

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const profileFields = [
    { label:"Full Name", value:user?.name||"—" },
    { label:"Email Address", value:user?.email||"—" },
    { label:"Member Since", value:user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN",{year:"numeric",month:"long"}) : "—" },
  ];

  const quickLinks = [
    { label:"Dashboard", sub:"Overview of your finances", icon:"📊", to:"/dashboard" },
    { label:"Finance Score", sub:"View your behavioral score", icon:"🏆", to:"/score" },
    { label:"Budget Planner", sub:"Manage monthly limits", icon:"🎯", to:"/budget" },
    { label:"SMS Parser", sub:"Parse bank transaction SMS", icon:"📱", to:"/sms-parser" },
    { label:"Redo Onboarding", sub:"Update your profile setup", icon:"🔄", action:() => { sessionStorage.removeItem("expenseiq_onboarding_done"); navigate("/onboarding"); } },
  ];

  return (
    <div className="space-y-5 stagger">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>Settings</h1>
        <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Manage your profile and account preferences</p>
      </div>

      {/* Profile hero */}
      <div className="card card-gradient">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shrink-0" style={{ background:"var(--gradient-primary)" }}>
            {user?.name?.charAt(0).toUpperCase()||"U"}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>{user?.name||"Student"}</h2>
            <p className="text-sm" style={{ color:"var(--text-secondary)" }}>{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background:"rgba(99,102,241,0.12)", color:"var(--primary)", border:"1px solid rgba(99,102,241,0.2)" }}>
              ✓ Student Account
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {profileFields.map(f => (
            <div key={f.label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background:"var(--bg-tertiary)", border:"1px solid var(--border-light)" }}>
              <span className="text-xs font-medium" style={{ color:"var(--text-tertiary)" }}>{f.label}</span>
              <span className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick navigation */}
      <div className="card !p-0 overflow-hidden">
        <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color:"var(--text-muted)" }}>Quick Navigation</p>
        {quickLinks.map((l, i) => (
          <button key={l.label}
            onClick={l.to ? () => navigate(l.to!) : l.action}
            className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition"
            style={{
              borderTop: i>0 ? "1px solid var(--border-light)" : "none",
              color:"var(--text-secondary)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="var(--bg-tertiary)"; e.currentTarget.style.color="var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background=""; e.currentTarget.style.color="var(--text-secondary)"; }}>
            <span className="text-lg">{l.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{l.label}</p>
              <p className="text-xs" style={{ color:"var(--text-tertiary)" }}>{l.sub}</p>
            </div>
            <ChevronRight/>
          </button>
        ))}
      </div>

      {/* About card */}
      <div className="card text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background:"var(--gradient-primary)" }}>
            <span className="text-xs font-black text-white">IQ</span>
          </div>
          <span className="text-base font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>ExpenseIQ</span>
        </div>
        
        <p className="text-xs" style={{ color:"var(--text-muted)" }}>Built with ❤️ by Ammar · AI-Powered Finance for Students</p>
      </div>

      {/* Logout */}
      <button onClick={logout} className="btn-secondary w-full" style={{ color:"var(--error)", borderColor:"rgba(239,68,68,0.2)" }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Sign Out
      </button>
    </div>
  );
};
export default Settings;
