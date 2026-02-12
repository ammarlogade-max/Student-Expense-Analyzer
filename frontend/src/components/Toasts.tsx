import { useToast } from "../context/ToastContext";

const toneStyles = {
  success: "bg-emerald-500 text-white",
  error: "bg-rose-500 text-white",
  info: "bg-slate-900 text-white"
};

const Toasts = () => {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[240px] rounded-2xl px-4 py-3 text-sm shadow-xl ${
            toneStyles[toast.tone || "info"]
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{toast.title}</span>
            <button
              aria-label="Dismiss notification"
              className="text-xs opacity-80"
              onClick={() => remove(toast.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toasts;
