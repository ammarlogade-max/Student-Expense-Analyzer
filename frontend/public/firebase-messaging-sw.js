/**
 * firebase-messaging-sw.js
 *
 * IMPORTANT: This file is auto-populated at build time by scripts/inject-sw-env.js
 * The __FIREBASE_*__ placeholders are replaced with real values from .env
 * DO NOT hardcode real values here — they get committed to git.
 *
 * If you see "YOUR_API_KEY" in production, the inject script didn't run.
 */

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "__FIREBASE_API_KEY__",
  authDomain:        "__FIREBASE_AUTH_DOMAIN__",
  projectId:         "__FIREBASE_PROJECT_ID__",
  storageBucket:     "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId:             "__FIREBASE_APP_ID__",
});

const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const data = payload.data ?? {};

  let actions = [];
  try { actions = JSON.parse(data.actions ?? "[]"); } catch {}

  self.registration.showNotification(title ?? "ExpenseIQ", {
    body:               body ?? "",
    icon:               "/icons/icon-192.png",
    badge:              "/icons/badge-72.png",
    tag:                data.type ?? "expenseiq",
    requireInteraction: actions.length > 0,
    vibrate:            [200, 100, 200],
    data,
    actions: actions.map((a) => ({ action: a.action, title: a.title })),
  });
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data   = event.notification.data ?? {};
  const action = event.action;

  let url = "/dashboard";
  if (action === "voice_entry") url = "/notification-voice";
  else if (action === "text_entry") url = "/notification-text";
  else if (data.action_url) url = data.action_url;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(url)) { c.focus(); return; }
      }
      return self.clients.openWindow(url);
    })
  );
});
