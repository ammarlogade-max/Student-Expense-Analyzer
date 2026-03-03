/**
 * NotificationBanner
 *
 * Shown once when the user logs in and hasn't granted push permission yet.
 * Dismisses itself and never shows again after the user chooses.
 *
 * Place inside DashboardLayout so it appears on all authenticated pages.
 */

import { useEffect, useState } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const DISMISSED_KEY = "expenseiq_notif_banner_dismissed";

const NotificationBanner = () => {
  const { permissionState, requestPermission, isGranted, isDenied, isUnsupported } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed && permissionState === "unknown") {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, [permissionState]);

  // Hide once granted
  useEffect(() => {
    if (isGranted) setVisible(false);
  }, [isGranted]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function enable() {
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
    dismiss();
  }

  if (!visible || isDenied || isUnsupported || isGranted) return null;

  return (
    <div className="animate-fade-up mx-0 mb-4 flex items-start gap-3 rounded-2xl p-4"
      style={{ background:"linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.08) 100%)", border:"1px solid rgba(99,102,241,0.25)" }}>

      {/* Bell icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.25)" }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#6366f1" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>
          Enable push notifications
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color:"var(--text-secondary)" }}>
          Get budget alerts, streak reminders, and the 8 PM cash reminder with one-tap voice logging. No spam.
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button onClick={enable} disabled={requesting}
            className="btn-primary !px-4 !py-2 text-xs !min-h-[34px]">
            {requesting ? "Requesting…" : "Enable Notifications"}
          </button>
          <button onClick={dismiss}
            className="btn-ghost !px-3 !py-2 text-xs !min-h-[34px]">
            Not now
          </button>
        </div>
      </div>

      {/* Close */}
      <button onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition"
        style={{ color:"var(--text-tertiary)" }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
};

export default NotificationBanner;
