/**
 * NotificationDebug.tsx
 *
 * Drop this component into Settings.tsx temporarily to diagnose
 * why notifications aren't working. Shows:
 *   - Browser permission state
 *   - FCM token (first 20 chars)
 *   - Whether service worker is registered
 *   - Firebase config loaded (non-empty)
 *   - Whether token was registered with backend
 *
 * Usage: add <NotificationDebug /> anywhere in Settings.tsx
 * Remove it once notifications are confirmed working.
 */

import { useEffect, useState } from "react";

interface DiagResult {
  label:  string;
  status: "ok" | "error" | "warn";
  detail: string;
}

export default function NotificationDebug() {
  const [results, setResults] = useState<DiagResult[]>([]);

  useEffect(() => {
    const run = async () => {
      const out: DiagResult[] = [];

      // 1. Notification API
      if (!("Notification" in window)) {
        out.push({ label: "Notification API", status: "error", detail: "Not available in this browser" });
      } else {
        out.push({ label: "Notification API", status: "ok", detail: "Available" });
      }

      // 2. Permission state
      const perm = Notification.permission;
      out.push({
        label: "Permission", status: perm === "granted" ? "ok" : perm === "denied" ? "error" : "warn",
        detail: perm,
      });

      // 3. Firebase SW registered
      if (!("serviceWorker" in navigator)) {
        out.push({ label: "Firebase SW", status: "error", detail: "Service workers not supported" });
      } else {
        const regs = await navigator.serviceWorker.getRegistrations();
        const hasFcmSw = regs.some((r) => r.active?.scriptURL?.includes("firebase-messaging-sw"));
        out.push({
          label: "Firebase SW", status: hasFcmSw ? "ok" : "error",
          detail: hasFcmSw ? "Registered ✓" : `NOT found. SWs: ${regs.map((r) => r.active?.scriptURL?.split("/").pop()).join(", ") || "none"}`,
        });
      }

      // 4. Firebase API key
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      out.push({
        label: "Firebase API Key", status: apiKey && !apiKey.includes("YOUR") && apiKey !== "dummy-key" ? "ok" : "error",
        detail: apiKey ? (apiKey.includes("YOUR") || apiKey === "dummy-key" ? "❌ Placeholder — not set in Vercel!" : apiKey.slice(0, 8) + "…") : "❌ Missing",
      });

      // 5. VAPID key
      const vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      out.push({
        label: "VAPID Key", status: vapid && vapid !== "dummy-vapid-key" ? "ok" : "error",
        detail: vapid && vapid !== "dummy-vapid-key" ? vapid.slice(0, 12) + "…" : "❌ Missing — check Vercel env vars",
      });

      // 6. FCM token saved
      const token = localStorage.getItem("expenseiq_fcm_token");
      out.push({
        label: "FCM Token", status: token ? "ok" : "warn",
        detail: token ? token.slice(0, 20) + "…" : "Not yet registered — grant notification permission",
      });

      setResults(out);
    };
    run();
  }, []);

  const colors = { ok: "var(--success)", error: "var(--error)", warn: "var(--warning)" };
  const icons  = { ok: "✅", error: "❌", warn: "⚠️" };

  return (
    <div className="card mt-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        🔧 Notification Diagnostics
      </p>
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.label} className="flex items-start gap-2">
            <span className="shrink-0">{icons[r.status]}</span>
            <div className="min-w-0">
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.label}: </span>
              <span className="text-xs break-all" style={{ color: colors[r.status] }}>{r.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => window.location.reload()} className="btn-ghost mt-3 w-full text-xs">
        Re-run diagnostics
      </button>
    </div>
  );
}
