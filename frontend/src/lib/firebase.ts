/**
 * Firebase SDK initialisation for ExpenseIQ frontend.
 *
 * SETUP:
 *   1. Go to Firebase Console → Project Settings → General
 *   2. Scroll to "Your apps" → Web app → copy the config object
 *   3. Add values to frontend/.env:
 *        VITE_FIREBASE_API_KEY=...
 *        VITE_FIREBASE_AUTH_DOMAIN=...
 *        VITE_FIREBASE_PROJECT_ID=...
 *        VITE_FIREBASE_STORAGE_BUCKET=...
 *        VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *        VITE_FIREBASE_APP_ID=...
 *        VITE_FIREBASE_VAPID_KEY=...   ← Cloud Messaging → Web Push Certificates
 *   4. npm install firebase
 */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialise only once (Vite HMR can re-run this module)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let _messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (_messaging) return _messaging;
  // FCM requires a browser context + service worker support
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    _messaging = getMessaging(app);
    return _messaging;
  } catch {
    return null;
  }
}

/**
 * Request notification permission and get the FCM token.
 * Returns null if the user denies permission or FCM isn't available.
 */
export async function requestFcmToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    return token || null;
  } catch (err) {
    console.warn("[FCM] Failed to get token:", err);
    return null;
  }
}

/**
 * Listen for foreground messages (when the app is open).
 * Background messages are handled by the service worker.
 */
export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
