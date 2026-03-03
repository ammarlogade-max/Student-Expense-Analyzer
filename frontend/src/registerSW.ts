/**
 * registerSW.ts — Service Worker registration
 *
 * Called once from main.tsx after React mounts.
 * Registers /sw.js (PWA caching layer).
 * Note: /firebase-messaging-sw.js is registered separately by the Firebase SDK.
 *
 * Handles:
 *  - First install
 *  - Updates — posts SKIP_WAITING when the user clicks "Update" in UpdatePrompt
 */

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("[SW] Service workers not supported");
    return;
  }

  // Only register in production, or explicitly in dev via env flag
  if (
    import.meta.env.PROD ||
    import.meta.env.VITE_ENABLE_SW === "true"
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);

          // Listen for the SKIP_WAITING message from UpdatePrompt
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "SKIP_WAITING" && reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          });

          // Periodically check for updates (every 60 minutes)
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch((err) => {
          console.error("[SW] Registration failed:", err);
        });
    });
  } else {
    console.log("[SW] Skipping registration in development (set VITE_ENABLE_SW=true to enable)");
  }
}
