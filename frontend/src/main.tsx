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
