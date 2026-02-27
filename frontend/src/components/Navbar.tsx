import { useAuth } from "../context/AuthContext";

type Props = {
  onOpenMenu: () => void;
  onOpenPalette: () => void;
};

const Navbar = ({ onOpenMenu, onOpenPalette }: Props) => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-8"
      style={{
        background: "rgba(8,12,18,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Left: hamburger (mobile) + greeting */}
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)" }}
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-5 rounded" style={{ background: "var(--text)" }} />
          <span className="block h-0.5 w-4 rounded" style={{ background: "var(--text)" }} />
          <span className="block h-0.5 w-5 rounded" style={{ background: "var(--text)" }} />
        </button>

        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {greeting} 👋
          </p>
          <h1
            className="text-[15px] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {user?.name?.split(" ")[0] || "Student"}
          </h1>
        </div>
      </div>

      {/* Right: live dot + Ctrl+K */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-xs font-medium" style={{ color: "var(--lime)" }}>
            Live
          </span>
        </div>

        {/* Command palette shortcut */}
        <button
          onClick={onOpenPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-muted)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Ctrl K
        </button>
      </div>
    </header>
  );
};

export default Navbar;