import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Toasts from "./components/Toasts";
import { AdminAuthProvider } from "./context/AdminAuthContext";

const storedTheme = localStorage.getItem("sea_theme");
if (storedTheme === "dark") {
  document.body.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <AdminAuthProvider>
        <App />
        <Toasts />
        </AdminAuthProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
