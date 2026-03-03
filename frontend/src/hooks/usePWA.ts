/**
 * usePWA — PWA installation + online/offline + SW update detection
 *
 * Returns:
 *   canInstall      — true when the browser fires beforeinstallprompt
 *   isInstalled     — true when running in standalone / PWA mode
 *   isOnline        — live network status
 *   swUpdateReady   — true when a new SW version is waiting
 *   installApp()    — triggers the native install prompt
 *   updateApp()     — tells the waiting SW to take over → reloads
 *   syncPending     — number of offline expenses waiting to sync
 */

import { useCallback, useEffect, useRef, useState } from "react";

export function usePWA() {
  const [canInstall, setCanInstall]       = useState(false);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [swUpdateReady, setSwUpdateReady] = useState(false);
  const [syncPending, setSyncPending]     = useState(0);
  const deferredPrompt                    = useRef<any>(null);
  const swReg                             = useRef<ServiceWorkerRegistration | null>(null);

  // ── Detect standalone (installed) mode ────────────────────────────────────
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
  }, []);

  // ── Install prompt ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Also detect when user installed via browser menu (hides prompt)
    window.addEventListener("appinstalled", () => {
      setCanInstall(false);
      setIsInstalled(true);
      deferredPrompt.current = null;
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Online / Offline ───────────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── SW update detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      swReg.current = reg;

      // Check for an already-waiting SW (page was open during update)
      if (reg.waiting) setSwUpdateReady(true);

      // Listen for future updates
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setSwUpdateReady(true);
          }
        });
      });
    });

    // Listen for messages from SW (e.g. SYNC_DONE)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_DONE") {
        setSyncPending(0);
      }
      if (event.data?.type === "SYNC_START") {
        // SW is syncing — count queued items from IndexedDB
        countQueued().then(setSyncPending);
      }
    });
  }, []);

  // ── Count pending offline queue ────────────────────────────────────────────
  useEffect(() => {
    countQueued().then(setSyncPending);
  }, [isOnline]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const installApp = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      setIsInstalled(true);
    }
    deferredPrompt.current = null;
  }, []);

  const updateApp = useCallback(() => {
    const reg = swReg.current;
    if (!reg?.waiting) return;
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    reg.waiting.addEventListener("statechange", (e: any) => {
      if (e.target.state === "activated") window.location.reload();
    });
  }, []);

  return {
    canInstall,
    isInstalled,
    isOnline,
    swUpdateReady,
    syncPending,
    installApp,
    updateApp,
  };
}

// ── IndexedDB helper ─────────────────────────────────────────────────────────

async function countQueued(): Promise<number> {
  try {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const req = indexedDB.open("expenseiq-offline", 1);
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains("queue")) {
          db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
        }
      };
    });
    return await new Promise<number>((res, rej) => {
      const tx  = db.transaction("queue", "readonly");
      const req = tx.objectStore("queue").count();
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  } catch {
    return 0;
  }
}
