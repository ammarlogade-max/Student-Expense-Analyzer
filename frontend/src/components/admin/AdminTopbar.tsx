import { useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";

type Props = {
  onOpenMenu: () => void;
};

const AdminTopbar = ({ onOpenMenu }: Props) => {
  const { admin, logout } = useAdminAuth();
  const [darkMode, setDarkMode] = useState(() =>
    document.body.classList.contains("dark")
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold lg:hidden"
            onClick={onOpenMenu}
          >
            Menu
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Admin Dashboard
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              {admin?.name ?? "System Admin"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
            onClick={() => {
              const next = !darkMode;
              setDarkMode(next);
              if (next) {
                document.body.classList.add("dark");
                localStorage.setItem("sea_theme", "dark");
              } else {
                document.body.classList.remove("dark");
                localStorage.setItem("sea_theme", "light");
              }
            }}
          >
            {darkMode ? "Light" : "Dark"}
          </button>
          <button
            className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
