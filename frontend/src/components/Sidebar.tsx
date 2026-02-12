import { NavLink } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
  { to: "/expenses", label: "Expenses", icon: "wallet" },
  { to: "/analytics", label: "Analytics", icon: "chart" },
  { to: "/budget", label: "Budget", icon: "target" },
  { to: "/sms-parser", label: "SMS Parser", icon: "message" },
  { to: "/settings", label: "Settings", icon: "settings" }
];

const iconMap: Record<string, JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"
      />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M3 7a3 3 0 013-3h11a2 2 0 012 2v1h-9a3 3 0 000 6h9v3a2 2 0 01-2 2H6a3 3 0 01-3-3V7zm16 4a1 1 0 100 2h2v-2h-2z"
      />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M4 19h16v2H4v-2zm2-8h3v6H6v-6zm5-4h3v10h-3V7zm5 6h3v4h-3v-4z"
      />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1010 10h-2a8 8 0 11-8-8V2zm0 6a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l-2.1-.7.1-2.2-2.2-.6-1-2-2 .9-1.7-1.4-1.7 1.4-2-.9-1 2-2.2.6.1 2.2L3 12l2.1.7-.1 2.2 2.2.6 1 2 2-.9 1.7 1.4 1.7-1.4 2 .9 1-2 2.2-.6-.1-2.2L21 12z"
      />
    </svg>
  )
};

const Sidebar = ({ open, onClose }: Props) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-white shadow-xl transition-transform lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              ExpenseIQ
            </p>
            <p className="text-lg font-semibold">
              ExpenseIQ
            </p>
          </div>
          <button
            className="lg:hidden text-sm text-slate-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <nav className="px-4 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Core
          </p>
          <ul className="mt-4 space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-emerald-400 text-slate-900 shadow-lg"
                        : "text-slate-200 hover:bg-white/10"
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="text-lg">
                    {iconMap[item.icon]}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-400 via-amber-300 to-orange-400 p-4 text-slate-900">
            <p className="text-sm font-semibold">
              Pro Tip
            </p>
            <p className="text-xs">
              Track expenses daily to unlock smarter insights.
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
