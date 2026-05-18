import { NavLink } from "react-router-dom";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2 7-7 7 7m-14 0v10a1 1 0 001 1h3m8-11v10a1 1 0 01-1 1h-3m-6 0v-4a1 1 0 011-1h2a1 1 0 011 1v4" />
    </svg>
  );
}

function IconExpense() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function IconBudget() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10m-3-7h5a2 2 0 010 4H10" />
    </svg>
  );
}

function IconScore() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.36.967 1.724 1.724 0 001.7 1.25 1.724 1.724 0 011.675 2.06 1.724 1.724 0 00.865 1.93 1.724 1.724 0 010 2.988 1.724 1.724 0 00-.865 1.93 1.724 1.724 0 01-1.675 2.06 1.724 1.724 0 00-1.7 1.25 1.724 1.724 0 01-2.36.967 1.724 1.724 0 00-2.573 1.066 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.36-.967 1.724 1.724 0 00-1.7-1.25 1.724 1.724 0 01-1.675-2.06 1.724 1.724 0 00-.865-1.93 1.724 1.724 0 010-2.988 1.724 1.724 0 00.865-1.93 1.724 1.724 0 011.675-2.06 1.724 1.724 0 001.7-1.25 1.724 1.724 0 012.36-.967 1.724 1.724 0 002.573-1.066z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const items = [
  { to: "/dashboard", label: "Home", Icon: IconHome },
  { to: "/expenses", label: "Expenses", Icon: IconExpense },
  { to: "/budget", label: "Budget", Icon: IconBudget },
  { to: "/score", label: "Score", Icon: IconScore },
  { to: "/settings", label: "Settings", Icon: IconSettings },
];

const BottomNav = () => {
  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center lg:hidden"
      style={{
        background: "rgba(15,17,21,0.96)",
        borderTop: "1px solid var(--border-light)",
        backdropFilter: "blur(18px)",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200"
          style={({ isActive }) => ({
            color: isActive ? "var(--primary)" : "var(--text-tertiary)",
          })}
        >
          {({ isActive }) => (
            <>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: isActive ? "rgba(99,102,241,0.16)" : "transparent",
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                <Icon />
              </div>

              <span className="text-[10px] font-semibold tracking-wide">
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
