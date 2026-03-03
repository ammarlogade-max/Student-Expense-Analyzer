/**
 * OfflineBanner — slim bar shown at the top when the user loses connectivity
 *
 * Shows:  "You're offline — X expenses queued to sync"
 * Hides:  automatically when back online (with a brief "Back online!" flash)
 */

import { useEffect, useState } from "react";
import { usePWA } from "../hooks/usePWA";

export default function OfflineBanner() {
  const { isOnline, syncPending } = usePWA();
  const [justReconnected, setJustReconnected] = useState(false);
  const [prevOnline, setPrevOnline]           = useState(isOnline);

  useEffect(() => {
    if (!prevOnline && isOnline) {
      // Just came back online
      setJustReconnected(true);
      const t = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(t);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  if (isOnline && !justReconnected) return null;

  return (
    <div
      className="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium animate-fade-up"
      style={
        justReconnected
          ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }
          : { background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }
      }
    >
      {/* Status dot */}
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: justReconnected ? "#10b981" : "#f59e0b" }}
      />

      {justReconnected ? (
        <span>
          Back online!
          {syncPending > 0
            ? ` Syncing ${syncPending} queued expense${syncPending > 1 ? "s" : ""}…`
            : " All data synced."}
        </span>
      ) : (
        <span>
          You're offline
          {syncPending > 0
            ? ` — ${syncPending} expense${syncPending > 1 ? "s" : ""} will sync when reconnected`
            : " — cached data is available"}
        </span>
      )}
    </div>
  );
}
