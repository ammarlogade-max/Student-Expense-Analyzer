import { Link, useLocation } from "react-router-dom";

const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  expenses: "Expenses",
  analytics: "Analytics",
  budget: "Budget",
  cash: "Cash",
  "sms-parser": "SMS Parser",
  settings: "Settings"
};

const Breadcrumbs = () => {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link className="hover:text-emerald-600" to="/dashboard">
            Home
          </Link>
        </li>
        {parts.map((part, index) => {
          const path = `/${parts.slice(0, index + 1).join("/")}`;
          const label = routeMap[part] || part;
          return (
            <li key={path} className="flex items-center gap-2">
              <span className="text-slate-300">/</span>
              <Link className="hover:text-emerald-600" to={path}>
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
