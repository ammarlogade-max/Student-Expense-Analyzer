import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";   // ← KEEP THIS EXACT PATH - do not change to styles/globals.css
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Toasts from "./components/Toasts";

// App is always dark now - no localStorage theme switching needed
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
        <Toasts />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);