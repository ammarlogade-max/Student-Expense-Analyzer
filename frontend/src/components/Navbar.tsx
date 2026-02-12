import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Props = {
  onOpenMenu: () => void;
  onOpenPalette: () => void;
};

const Navbar = ({ onOpenMenu, onOpenPalette }: Props) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark")
  );

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("sea_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("sea_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const stored = localStorage.getItem("sea_theme");
    if (stored === "dark") {
      setDarkMode(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 md:px-8 lg:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onClick={onOpenMenu}
          >
            Menu
          </button>
          <button
            className="hidden md:inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onClick={onOpenPalette}
          >
            Ctrl + K
          </button>
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-lg font-semibold tracking-tight">
              {user?.name || "ExpenseIQ"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
