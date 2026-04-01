import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Toasts from "./components/Toasts";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { registerServiceWorker } from "./registerSW";
import { restoreFromPreferences } from "./lib/storage";

const storedTheme = localStorage.getItem("expenseiq_theme");
if (storedTheme === "light") {
  document.documentElement.setAttribute("data-theme", "light");
}

async function bootstrap() {
  await restoreFromPreferences();
  const isCapacitorNative = (window as any).Capacitor?.isNativePlatform?.() === true;
  if (isCapacitorNative) {
    document.documentElement.classList.add("platform-capacitor");
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#0f1115" });
    } catch {
      // ignore when status bar plugin is unavailable
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <App />
              <Toasts />
            </AdminAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  registerServiceWorker();
}

void bootstrap();
