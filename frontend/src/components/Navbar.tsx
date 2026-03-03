import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Props = { onOpenMenu: () => void; onOpenPalette: () => void };

const Navbar = ({ onOpenMenu, onOpenPalette }: Props) => {
  const { user } = useAuth();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);

    if (nextIsLight) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("expenseiq_theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("expenseiq_theme", "dark");
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:h-16 md:px-6"
      style={{
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-light)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition lg:hidden"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <span className="text-[10px] font-black text-white">IQ</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Expense
            <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              IQ
            </span>
          </span>
        </div>

        <button
          onClick={onOpenPalette}
          className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs transition lg:flex"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-tertiary)" }}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          Search
          <kbd className="ml-1 rounded px-1 py-0.5 font-mono text-[10px]" style={{ background: "var(--bg-tertiary)" }}>
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          title={isLight ? "Dark mode" : "Light mode"}
        >
          {isLight ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <div className="hidden flex-col items-end md:flex">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {user?.name?.split(" ")[0]}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Student Account
          </span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
          {user?.name?.charAt(0).toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
