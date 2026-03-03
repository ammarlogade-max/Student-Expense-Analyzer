/**
 * ExpenseIQ — Firebase Cloud Messaging Service Worker
 *
 * This file MUST be at /public/firebase-messaging-sw.js
 * (served from the root of your domain).
 *
 * What it does:
 *   1. Receives background push notifications from FCM
 *   2. Shows them using the Notifications API
 *   3. Handles notification action button clicks:
 *        🎤 Speak  → opens mic in a special popup, sends audio to backend
 *        ✏️ Type   → opens a tiny input popup, sends text to backend
 *   4. Sends the user's input to POST /api/notifications/action
 */


importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");


// ── Firebase initialisation ──────────────────────────────────────────────────
// These values must match your firebase.ts config.
firebase.initializeApp({
  apiKey:            "AIzaSyAJr8DBw70N6QLLTngMzbMxFF4GwA-Sh8o",
  authDomain:        "expenseiq-6ec61.firebaseapp.com",
  projectId:         "expenseiq-6ec61",
  storageBucket:     "expenseiq-6ec61.firebasestorage.app",
  messagingSenderId: "316146942822",
  appId:             "1:316146942822:web:d37c1f834c51fe75d1bea7",
});


const messaging = firebase.messaging();


// ── Background message handler ───────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);


  const { title, body } = payload.notification ?? {};
  const data   = payload.data ?? {};
  const type   = data.type ?? "";


  // Parse action buttons sent from the backend
  let actions = [];
  try {
    actions = JSON.parse(data.actions ?? "[]");
  } catch { /* ignore parse error */ }


  const notifOptions = {
    body:             body ?? "",
    icon:             "/icon-192.png",
    badge:            "/badge-72.png",
    tag:              type,          // deduplicates: same tag = replaces old notif
    requireInteraction: actions.length > 0, // keep visible if it has action buttons
    data,
    // Action buttons — shown natively on Chrome for Android + Chrome Desktop
    actions: actions.map((a) => ({
      action: a.action,
      title:  a.title,
      icon:   a.icon,
    })),
    // Visual tweaks
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };


  return self.registration.showNotification(title ?? "ExpenseIQ", notifOptions);
});


// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();


  const data   = event.notification.data ?? {};
  const action = event.action; // which button was tapped ("voice_entry" | "text_entry" | "")


  console.log("[SW] Notification clicked:", action || "(body tap)");


  if (action === "voice_entry") {
    // ── 🎤 Speak button ────────────────────────────────────────────────────
    // Open a tiny popup that activates the mic, transcribes, then posts
    event.waitUntil(
      openActionWindow("/notification-voice", data)
    );


  } else if (action === "text_entry") {
    // ── ✏️ Type button ─────────────────────────────────────────────────────
    // Open a tiny popup with a text input
    event.waitUntil(
      openActionWindow("/notification-text", data)
    );


  } else {
    // ── Body tap — navigate to action_url or home ──────────────────────────
    const url = data.action_url ?? "/dashboard";
    event.waitUntil(focusOrOpenWindow(url));
  }
});


// ── Helpers ──────────────────────────────────────────────────────────────────


async function openActionWindow(path, data) {
  const params = new URLSearchParams({ data: JSON.stringify(data) });
  const url    = `${path}?${params.toString()}`;


  // Try to focus an existing popup with this path
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    if (client.url.includes(path)) {
      await client.focus();
      return;
    }
  }


  // Open as a small popup window
  return self.clients.openWindow(url);
}


async function focusOrOpenWindow(url) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    if (client.url.includes(url)) {
      await client.focus();
      return;
    }
  }
  return self.clients.openWindow(url);
}
