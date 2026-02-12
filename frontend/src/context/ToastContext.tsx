import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";

type Toast = {
  id: string;
  title: string;
  tone?: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: Toast[];
  push: (title: string, tone?: Toast["tone"]) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((title: string, tone: Toast["tone"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, tone }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
