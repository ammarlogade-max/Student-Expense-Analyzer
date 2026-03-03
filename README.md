# Step 7 — PWA (Progressive Web App)

## What's in this folder

```
step7/
├── generate-icons.js                         ← run once to create all icon PNGs
├── frontend/
│   ├── index.html                            ← REPLACE your existing index.html
│   ├── vite.config.ts                        ← REPLACE your existing vite.config.ts
│   ├── public/
│   │   ├── manifest.json                     ← NEW
│   │   ├── offline.html                      ← NEW
│   │   └── sw.js                             ← NEW (PWA service worker)
│   └── src/
│       ├── registerSW.ts                     ← NEW
│       ├── hooks/
│       │   ├── usePWA.ts                     ← NEW
│       │   └── useOfflineQueue.ts            ← NEW
│       └── components/
│           ├── InstallPrompt.tsx             ← NEW
│           ├── UpdatePrompt.tsx              ← NEW
│           └── OfflineBanner.tsx             ← NEW
```

**3 existing files need small edits** (shown at the bottom).

---

## 1. Install dependency & generate icons

```bash
# Icon generator (dev-only, one-time)
npm install sharp --save-dev

# Run from your project root (where generate-icons.js lives)
node generate-icons.js
```

This creates everything in `frontend/public/icons/`:
`icon-72.png` through `icon-512.png`, two maskable variants,
shortcut icons, `badge-72.png`, `mic.png`, `pencil.png`.

> **Tip:** After generating, open `frontend/public/icons/icon-512.png`
> in a browser to verify it looks right before deploying.

---

## 2. Drop in all new files

Copy every file from `step7/frontend/` into your `frontend/` folder,
keeping the same folder structure.

| From (step7/) | To (your project) |
|---|---|
| `frontend/index.html` | `frontend/index.html` ← **replaces** existing |
| `frontend/vite.config.ts` | `frontend/vite.config.ts` ← **replaces** existing |
| `frontend/public/manifest.json` | `frontend/public/manifest.json` |
| `frontend/public/offline.html` | `frontend/public/offline.html` |
| `frontend/public/sw.js` | `frontend/public/sw.js` |
| `frontend/src/registerSW.ts` | `frontend/src/registerSW.ts` |
| `frontend/src/hooks/usePWA.ts` | `frontend/src/hooks/usePWA.ts` |
| `frontend/src/hooks/useOfflineQueue.ts` | `frontend/src/hooks/useOfflineQueue.ts` |
| `frontend/src/components/InstallPrompt.tsx` | `frontend/src/components/InstallPrompt.tsx` |
| `frontend/src/components/UpdatePrompt.tsx` | `frontend/src/components/UpdatePrompt.tsx` |
| `frontend/src/components/OfflineBanner.tsx` | `frontend/src/components/OfflineBanner.tsx` |
| `generate-icons.js` | project root |

---

## 3. Edit 3 existing files

### 3a. frontend/src/main.tsx

Add 2 lines — import and call `registerServiceWorker()`.

**Add to imports:**
```tsx
import { registerServiceWorker } from "./registerSW";
```

**Add after the last line (after the `ReactDOM.createRoot(...).render(...)` block):**
```tsx
// Step 7: Register PWA service worker
registerServiceWorker();
```

---

### 3b. frontend/src/layouts/DashboardLayout.tsx

Add the three new banner/prompt components. They self-manage visibility,
so you just drop them in — no props needed.

**Add to imports:**
```tsx
import InstallPrompt from "../components/InstallPrompt";
import UpdatePrompt  from "../components/UpdatePrompt";
import OfflineBanner from "../components/OfflineBanner";
```

**Inside `<main>`, add before `<NotificationBanner />`:**
```tsx
<OfflineBanner />
<InstallPrompt />
```

**Just before the closing `</div>` of the outermost wrapper** (outside `<main>`,
at the same level as `<BottomNav />`):
```tsx
<UpdatePrompt />
```

The final layout structure should look like:
```tsx
<div className="min-h-screen" ...>
  <Sidebar ... />
  <div className="lg:pl-[260px]">
    <Navbar ... />
    <main ...>
      <OfflineBanner />     {/* ← new */}
      <InstallPrompt />     {/* ← new */}
      <NotificationBanner />
      <Outlet />
    </main>
  </div>
  <BottomNav />
  <UpdatePrompt />          {/* ← new, outside main */}
  <CommandPalette ... />
</div>
```

---

### 3c. frontend/src/hooks/useOfflineQueue.ts → Expenses.tsx (optional)

If you want true offline expense logging (not just the voice/text popup),
swap the add-expense call in `Expenses.tsx` to use `useOfflineQueue`:

**In Expenses.tsx, add import:**
```tsx
import { useOfflineQueue } from "../hooks/useOfflineQueue";
```

**Inside the component:**
```tsx
const { addExpense: addExpenseOffline } = useOfflineQueue();
```

**Replace your `addExpense(...)` API call with:**
```tsx
await addExpenseOffline({ amount, category, description });
```

This way, if the user is offline when they hit Save, the expense is queued
to IndexedDB and synced automatically when they reconnect — no data lost.

---

## 4. sw.js and firebase-messaging-sw.js coexistence

You already have `firebase-messaging-sw.js` from Step 6.
The new `sw.js` is a **separate** service worker for PWA caching only.

They coexist without conflict because:
- `firebase-messaging-sw.js` is registered by the Firebase SDK at its own scope
- `sw.js` is registered by `registerSW.ts` at `/` scope

Both run independently. No changes to `firebase-messaging-sw.js` needed.

---

## 5. Testing the PWA locally

```bash
# Build first (SW only activates in production builds by default)
cd frontend
npm run build
npm run preview     # serves at http://localhost:4173
```

Then in Chrome:
1. Open DevTools → **Application** tab
2. Check **Manifest** — should show all icons and metadata
3. Check **Service Workers** — should show sw.js as "Activated and running"
4. Check **Cache Storage** — should show expenseiq-app-v1, expenseiq-api-v1 etc.
5. In **Network** tab → set "Offline" → reload → you should see offline.html

To test the install prompt:
- Open Chrome → three-dot menu → **Install ExpenseIQ**
- Or wait for the `beforeinstallprompt` banner to fire (may take a few seconds)

To test on Android:
```bash
# Expose local server via ngrok (required for HTTPS, needed for PWA install)
npx ngrok http 4173
# Open the ngrok URL on your phone in Chrome
```

---

## 6. Enable SW in development (optional)

By default, the SW is only registered in production builds.
To enable in dev for testing:

```bash
# frontend/.env
VITE_ENABLE_SW=true
```

Then `npm run dev` — the SW will register at localhost.
**Remember to unregister it manually in DevTools when done**, otherwise
cached responses can interfere with dev hot reload.

---

## What each file does

| File | Purpose |
|---|---|
| `manifest.json` | Tells the browser the app name, icons, colors, shortcuts, and that it's installable |
| `sw.js` | Service worker — caches app shell + API responses, handles offline, replays queued expenses |
| `offline.html` | Shown when user navigates while fully offline — auto-redirects when connection returns |
| `registerSW.ts` | Registers sw.js on app load, handles update messaging |
| `usePWA.ts` | Hook exposing `canInstall`, `isOnline`, `swUpdateReady`, `installApp()`, `updateApp()` |
| `useOfflineQueue.ts` | Wraps expense API — saves to IndexedDB if offline, registers background sync |
| `InstallPrompt.tsx` | "Add to Home Screen" banner — shows once when app is installable |
| `UpdatePrompt.tsx` | "Update available" chip — appears when new SW is waiting |
| `OfflineBanner.tsx` | Slim bar showing offline status and queued expense count |
| `generate-icons.js` | One-time script to generate all PNG icon sizes from SVG |
| `index.html` | Adds manifest link, theme-color, iOS meta tags, OG tags, font preloads |
| `vite.config.ts` | Adds chunk splitting so vendor JS is cached separately from app code |

---

## PWA Score checklist (Lighthouse)

After deploying, run Lighthouse in Chrome DevTools → PWA tab.
You should get 100 if all these are in place:

- [x] `manifest.json` with name, icons, start_url, display
- [x] Service worker registered and active
- [x] Served over HTTPS (required in production)
- [x] `theme-color` meta tag
- [x] Offline fallback page
- [x] Icons at 192x192 and 512x512 (both `any` and `maskable`)
- [x] `apple-mobile-web-app-capable` for iOS
- [x] Viewport meta tag with `initial-scale=1`
