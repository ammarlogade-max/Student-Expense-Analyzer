import { NavLink } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/ml", label: "ML Insights" },
  { to: "/admin/system", label: "System" }
];

const AdminSidebar = ({ open, onClose }: Props) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-slate-950 text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Control Center
          </p>
          <h2 className="mt-2 text-2xl font-semibold">ExpenseIQ Admin</h2>
          <p className="mt-2 text-sm text-slate-400">
            Monitor product growth, ML quality, and system health from one place.
          </p>
        </div>

        <nav className="px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-200 hover:bg-white/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-gradient-to-br from-cyan-400 via-sky-300 to-emerald-300 p-5 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Live Ops
            </p>
            <p className="mt-2 text-sm font-medium">
              Real events from logins, expenses, SMS imports, and ML requests.
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
