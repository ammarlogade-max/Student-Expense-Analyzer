import { useEffect } from "react";
import { useToast } from "../context/ToastContext";

const icons: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ"
};

const styles: Record<string, React.CSSProperties> = {
  success: {
    background: "rgba(200,255,0,0.12)",
    border: "1px solid rgba(200,255,0,0.25)",
    color: "#c8ff00"
  },
  error: {
    background: "rgba(255,77,109,0.12)",
    border: "1px solid rgba(255,77,109,0.25)",
    color: "#ff4d6d"
  },
  info: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#f0f4ff"
  }
};

const Toasts = () => {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed left-3 right-3 top-4 z-[100] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4">
      {toasts.map((toast) => {
        const tone = toast.tone || "info";
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium animate-scale-in w-full sm:min-w-[220px] sm:max-w-[320px]"
            style={{
              ...styles[tone],
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
            }}
          >
            <span
              className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: tone === "success" ? "rgba(200,255,0,0.2)" :
                             tone === "error" ? "rgba(255,77,109,0.2)" :
                             "rgba(255,255,255,0.1)"
              }}
            >
              {icons[tone]}
            </span>
            <span className="flex-1">{toast.title}</span>
            <button
              onClick={() => remove(toast.id)}
              className="text-xs opacity-50 hover:opacity-100 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toasts;
