/**
 * ExpenseIQ Service Worker — PWA Offline & Caching
 *
 * Strategy per resource type:
 *   - App shell (HTML/JS/CSS)  → Cache First, fallback to network
 *   - API calls                → Network First, fallback to cache
 *   - Static assets (icons)    → Cache First, long TTL
 *   - Google Fonts             → Stale While Revalidate
 *
 * This file lives at /public/sw.js and is registered manually in main.tsx.
 * It is SEPARATE from firebase-messaging-sw.js (which handles FCM only).
 */

const APP_CACHE    = "expenseiq-app-v1";
const API_CACHE    = "expenseiq-api-v1";
const ASSET_CACHE  = "expenseiq-assets-v1";
const FONT_CACHE   = "expenseiq-fonts-v1";

// ── App shell files to pre-cache on install ───────────────────────────────────
// Vite generates hashed filenames — we cache the root HTML and let
// the browser re-fetch JS/CSS on each new deployment.
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── API routes we want to cache (Network First) ───────────────────────────────
const API_CACHE_PATTERNS = [
  /\/api\/expenses/,
  /\/api\/budget/,
  /\/api\/score/,
  /\/api\/cash/,
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if some precache URLs aren't available yet
        console.warn("[SW] Precache partial failure (ok in dev):", err);
      });
    })
  );
  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  const keepCaches = [APP_CACHE, API_CACHE, ASSET_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── Fetch: route requests to correct strategy ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // ── Google Fonts → Stale While Revalidate ──────────────────────────────────
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // ── Firebase CDN (for firebase-messaging-sw compat scripts) → Cache First ──
  if (url.hostname.includes("gstatic.com") || url.hostname.includes("firebaseapp.com")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // ── API calls → Network First with offline fallback ───────────────────────
  const isApiCall = API_CACHE_PATTERNS.some((p) => p.test(url.pathname));
  if (isApiCall) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ── Static assets (icons, images, fonts files) → Cache First ─────────────
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/screenshots/") ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ttf)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // ── App shell (HTML navigation) → Network First, fallback /offline.html ───
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // ── JS / CSS (Vite bundles) → Stale While Revalidate ─────────────────────
  if (/\.(js|css)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
    return;
  }

  // Default: network only
  event.respondWith(fetch(request));
});

// ── Caching strategies ────────────────────────────────────────────────────────

/** Cache First — serve from cache, update in background */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Asset unavailable offline", { status: 503 });
  }
}

/** Network First — try network, fall back to cache */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return a structured offline JSON response for API calls
    return new Response(
      JSON.stringify({ error: "offline", message: "You are offline. Showing cached data." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Stale While Revalidate — serve cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response("Unavailable", { status: 503 });
}

// ── Background Sync — queue failed expense POSTs ──────────────────────────────
// When the user adds an expense offline, it gets queued and replayed when back online.
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-expenses") {
    event.waitUntil(syncQueuedExpenses());
  }
});

async function syncQueuedExpenses() {
  const clients = await self.clients.matchAll();
  // Notify all open tabs that sync is happening
  clients.forEach((client) => client.postMessage({ type: "SYNC_START" }));

  try {
    // Open the IndexedDB queue written by the offline expense form
    const db = await openOfflineDB();
    const queued = await getAllQueued(db);

    console.log(`[SW] Syncing ${queued.length} queued expenses...`);

    for (const item of queued) {
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${item.token}`,
          },
          body: JSON.stringify(item.expense),
        });
        if (res.ok) {
          await deleteQueued(db, item.id);
          console.log("[SW] Synced expense:", item.expense.category);
        }
      } catch {
        console.warn("[SW] Still offline, will retry later");
      }
    }

    // Notify tabs that sync finished
    const remaining = await getAllQueued(db);
    clients.forEach((client) =>
      client.postMessage({ type: "SYNC_DONE", count: queued.length - remaining.length })
    );
  } catch (err) {
    console.error("[SW] Sync failed:", err);
  }
}

// ── IndexedDB helpers for offline queue ──────────────────────────────────────

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("expenseiq-offline", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getAllQueued(db) {
  return new Promise((resolve, reject) => {
    const tx   = db.transaction("queue", "readonly");
    const req  = tx.objectStore("queue").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function deleteQueued(db, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction("queue", "readwrite");
    const req = tx.objectStore("queue").delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Push notification passthrough ─────────────────────────────────────────────
// NOTE: Actual push handling lives in firebase-messaging-sw.js
// This SW only handles the PWA caching layer.
// Firebase's SW and this SW coexist via importScripts in firebase-messaging-sw.js.
