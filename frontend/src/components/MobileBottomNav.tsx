import { NavLink, useLocation } from "react-router-dom";

type Props = {
  onOpenMore: () => void;
};

const items = [
  { to: "/dashboard", label: "Home", icon: "⌂" },
  { to: "/expenses", label: "Expenses", icon: "💳" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/cash", label: "Cash", icon: "💵" }
];

const MobileBottomNav = ({ onOpenMore }: Props) => {
  const location = useLocation();
  const moreActive =
    location.pathname === "/sms-parser" ||
    location.pathname === "/settings" ||
    location.pathname === "/budget" ||
    location.pathname === "/score";

  return (
    <nav className="bottom-nav lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          title={item.label}
          className="px-2 py-1.5 rounded-xl text-lg leading-none font-semibold transition-all text-center min-w-[62px]"
          style={({ isActive }) => ({
            color: isActive ? "var(--lime)" : "var(--text-muted)",
            background: isActive ? "rgba(200,255,0,0.12)" : "transparent"
          })}
        >
          {item.icon}
        </NavLink>
      ))}

      <button
        onClick={onOpenMore}
        aria-label="More"
        title="More"
        className="px-2 py-1.5 rounded-xl text-lg leading-none font-semibold transition-all min-w-[62px]"
        style={{
          color: moreActive ? "var(--lime)" : "var(--text-muted)",
          background: moreActive ? "rgba(200,255,0,0.12)" : "transparent"
        }}
      >
        ⋯
      </button>
    </nav>
  );
};

export default MobileBottomNav;
