/**
 * InstallPrompt — "Add to Home Screen" banner
 *
 * Shows automatically when the browser fires beforeinstallprompt
 * (i.e. the app is installable). Dismissed permanently after choice.
 * Place inside DashboardLayout alongside NotificationBanner.
 */

import { useEffect, useState } from "react";
import { usePWA } from "../hooks/usePWA";

const DISMISSED_KEY = "expenseiq_install_dismissed";

export default function InstallPrompt() {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [visible, setVisible]   = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (canInstall && !isInstalled && !dismissed) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
  }, [canInstall, isInstalled]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstall() {
    setLoading(true);
    await installApp();
    setLoading(false);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      className="animate-fade-up mb-4 flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.10) 0%, rgba(99,102,241,0.08) 100%)",
        border: "1px solid rgba(20,184,166,0.25)",
      }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#14b8a6" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Install ExpenseIQ
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Add to your home screen for instant access, offline support, and a full app experience — no App Store needed.
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            disabled={loading}
            className="btn-primary !px-4 !py-2 text-xs !min-h-[34px]"
            style={{ background: "linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)" }}
          >
            {loading ? "Installing…" : "Install App"}
          </button>
          <button
            onClick={dismiss}
            className="btn-ghost !px-3 !py-2 text-xs !min-h-[34px]"
          >
            Not now
          </button>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ color: "var(--text-tertiary)" }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
