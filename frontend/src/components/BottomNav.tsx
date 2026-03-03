import { NavLink } from "react-router-dom";

function IconHome() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> }
function IconCard() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> }
function IconChart() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> }
function IconCash() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg> }
function IconTrophy() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> }

const items = [
  { to: "/dashboard", label: "Home",     Icon: IconHome },
  { to: "/expenses",  label: "Expenses", Icon: IconCard },
  { to: "/analytics", label: "Charts",   Icon: IconChart },
  { to: "/cash",      label: "Cash",     Icon: IconCash },
  { to: "/score",     label: "Score",    Icon: IconTrophy },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center lg:hidden"
    style={{
      background: "rgba(15,17,21,0.97)",
      borderTop: "1px solid var(--border-light)",
      backdropFilter: "blur(16px)",
      paddingBottom: "env(safe-area-inset-bottom)",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.35)"
    }}>
    {items.map(({ to, label, Icon }) => (
      <NavLink key={to} to={to}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all"
        style={({ isActive }) => ({
          color: isActive ? "var(--primary)" : "var(--text-tertiary)",
        })}>
        {({ isActive }) => (
          <>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
              style={{ background: isActive ? "rgba(99,102,241,0.15)" : "transparent" }}>
              <Icon/>
            </span>
            <span className="text-[9.5px] font-semibold tracking-wide">{label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
export default BottomNav;
