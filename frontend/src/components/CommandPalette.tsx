import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const routes = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Expenses", path: "/expenses" },
  { label: "Analytics", path: "/analytics" },
  { label: "Budget", path: "/budget" },
  { label: "SMS Parser", path: "/sms-parser" },
  { label: "Settings", path: "/settings" }
];

const CommandPalette = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter((route) =>
      route.label.toLowerCase().includes(term)
    );
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-900/40 px-4 pt-24 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
        />
        <div className="mt-3 max-h-64 space-y-2 overflow-auto">
          {results.map((item) => (
            <button
              key={item.path}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm hover:bg-emerald-50"
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <span>{item.label}</span>
              <span className="text-xs text-slate-400">{item.path}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No matches found.
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Tip: Press Esc to close.
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
