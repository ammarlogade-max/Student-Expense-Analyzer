# Step 9 — Free Deployment (₹0/month, forever)

## Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETELY FREE FOREVER                   │
├──────────────┬──────────────────────────────────────────────┤
│ Vercel       │ Frontend (React PWA)       free, no limits   │
│ Render       │ Backend (Node.js)          free, 750hr/mo     │
│ Render       │ ML Service (FastAPI)       free, 750hr/mo     │
│ Neon         │ PostgreSQL database        free, never expires│
│ cron-job.org │ Keep-alive pinger          free               │
│ GitHub       │ CI/CD (Actions)            free               │
└──────────────┴──────────────────────────────────────────────┘
```

**Why Neon and not Render for the database?**
Render's free PostgreSQL deletes your data after 90 days. Neon's free
tier is permanent — 0.5 GB storage, no credit card, never expires.
0.5 GB holds ~500,000 expense records — more than enough.

**Why cron-job.org?**
Render free services sleep after 15 min of inactivity. First request
after sleeping takes ~60 seconds (cold start). A free ping every 14 min
keeps both services warm so your app opens instantly every time.

---

## Files in this folder

```
step9/
├── README.md                              ← this file
├── backend/
│   ├── Dockerfile                         ← multi-stage Node.js build (keep)
│   ├── .dockerignore                      ← (keep)
│   ├── server.ts                          ← put in backend/ root
│   ├── health.route.ts                    ← replace src/routes/health.route.ts
│   ├── tsconfig.production.json           ← put in backend/
│   ├── package-scripts.json              ← update backend/package.json scripts
│   └── render.yaml                        ← put in backend/
├── ml_service/
│   └── Dockerfile                         ← (keep)
├── frontend/
│   ├── vercel.json                        ← put in frontend/
│   └── .env.production                   ← template — values go in Vercel dashboard
└── root/
    ├── docker-compose.yml                 ← put at project root (local testing)
    ├── .env.production                   ← template for local docker-compose
    ├── keepalive.js                       ← optional: run locally to keep warm
    └── .github-workflows-deploy.yml      ← rename → .github/workflows/deploy.yml
```

---

## Step 1 — Copy files into your project (5 min)

| From (step9/) | To (your project) |
|---|---|
| `backend/Dockerfile` | `backend/Dockerfile` |
| `backend/.dockerignore` | `backend/.dockerignore` |
| `backend/server.ts` | `backend/server.ts` |
| `backend/health.route.ts` | `backend/src/routes/health.route.ts` ← replaces existing |
| `backend/tsconfig.production.json` | `backend/tsconfig.production.json` |
| `backend/render.yaml` | `backend/render.yaml` |
| `ml_service/Dockerfile` | `ml_service/Dockerfile` |
| `frontend/vercel.json` | `frontend/vercel.json` |
| `root/docker-compose.yml` | `docker-compose.yml` (project root) |
| `root/keepalive.js` | `keepalive.js` (project root) |
| `root/.github-workflows-deploy.yml` | `.github/workflows/deploy.yml` |

### Update backend/package.json scripts

Open `backend/package.json`, find the `"scripts"` block, replace with:

```json
"scripts": {
  "dev":         "tsx watch src/server.ts",
  "build":       "tsc -p tsconfig.production.json",
  "start":       "node dist/server.js",
  "db:migrate":  "prisma migrate dev",
  "db:deploy":   "prisma migrate deploy",
  "db:generate": "prisma generate",
  "db:studio":   "prisma studio"
}
```

### Verify build works locally

```bash
cd backend
npm run build
# Must complete with 0 errors before you push
```

### Commit and push

```bash
git add .
git commit -m "feat: step 9 — free deployment config"
git push origin main
```

---

## Step 2 — Set up Neon database (5 min)

Neon is a serverless PostgreSQL provider. Free tier = 0.5 GB, no expiry,
no credit card needed.

1. Go to **https://neon.tech** → Sign up with GitHub (free)
2. Click **New Project**
   - Name: `expenseiq`
   - Region: **AWS Asia Pacific (Singapore)** — closest to India
   - PostgreSQL version: 16
3. Click **Create Project**
4. On the connection page:
   - Click the **Pooled connection** tab
   - Copy the full connection string — looks like:
     ```
     postgresql://expenseiq_owner:AbcXyz@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/expenseiq?sslmode=require
     ```
   - **Save this string — you'll paste it in Step 3 and Step 4**

---

## Step 3 — Deploy Backend on Render (10 min)

1. Go to **https://dashboard.render.com** → **New → Web Service**
2. Click **Connect a repository** → select your GitHub repo
3. Configure:
   - **Name:** `expenseiq-backend`
   - **Region:** Singapore
   - **Runtime:** Docker
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Docker Context Directory:** `./backend`
   - **Instance Type:** **Free**

4. Scroll down to **Environment Variables** → add each row:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | paste your Neon pooled connection string |
   | `JWT_SECRET` | click **Generate** → Render creates secure random value |
   | `REFRESH_SECRET` | click **Generate** |
   | `JWT_EXPIRES_IN` | `7d` |
   | `REFRESH_EXPIRES_IN` | `30d` |
   | `CORS_ORIGIN` | `https://expenseiq.vercel.app` (update after Step 5) |
   | `ML_SERVICE_URL` | `https://expenseiq-ml.onrender.com` (update after Step 4) |
   | `FIREBASE_SERVICE_ACCOUNT_PATH` | `/etc/secrets/firebase-service-account.json` |

5. **Secret Files** (for Firebase push notifications from Step 6):
   - In Render dashboard → your backend service → **Secret Files** tab
   - Click **Add Secret File**
   - Filename: `/etc/secrets/firebase-service-account.json`
   - Contents: open your local `backend/firebase-service-account.json` and paste the entire JSON

6. Click **Create Web Service**
7. First build takes ~5 minutes. Watch the logs. Success looks like:
   ```
   [Server] ExpenseIQ backend running on port 5000
   ```
8. Test it:
   ```bash
   curl https://expenseiq-backend.onrender.com/api/health
   # {"status":"ok","db":"ok",...}
   ```

9. Copy your backend service URL and Service ID for later:
   - URL: `https://expenseiq-backend.onrender.com`
   - Service ID: in Render dashboard → Settings → **Service ID** (starts with `srv-`)

---

## Step 4 — Deploy ML Service on Render (5 min)

1. **New → Web Service** → same repo
2. Configure:
   - **Name:** `expenseiq-ml`
   - **Region:** Singapore
   - **Runtime:** Docker
   - **Dockerfile Path:** `./ml_service/Dockerfile`
   - **Docker Context Directory:** `./ml_service`
   - **Instance Type:** **Free**

3. **Environment Variables:**

   | Key | Value |
   |---|---|
   | `ML_SERVICE_PORT` | `8001` |
   | `MODEL_PATH` | `/app/expense_model.pkl` |

4. Click **Create Web Service**
5. After deploy, test:
   ```bash
   curl https://expenseiq-ml.onrender.com/health
   ```
6. Copy the ML Service ID (Settings → Service ID)

7. Go back to your **backend** service → **Environment** tab → update:
   - `ML_SERVICE_URL` → `https://expenseiq-ml.onrender.com`
   - Click **Save Changes** → backend redeploys automatically

---

## Step 5 — Deploy Frontend on Vercel (5 min)

1. Go to **https://vercel.com** → **Add New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`  ← important, click Edit
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables** — add all of these:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://expenseiq-backend.onrender.com/api` |
   | `VITE_FIREBASE_API_KEY` | from Firebase Console |
   | `VITE_FIREBASE_AUTH_DOMAIN` | from Firebase Console |
   | `VITE_FIREBASE_PROJECT_ID` | from Firebase Console |
   | `VITE_FIREBASE_STORAGE_BUCKET` | from Firebase Console |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase Console |
   | `VITE_FIREBASE_APP_ID` | from Firebase Console |
   | `VITE_FIREBASE_VAPID_KEY` | from Firebase Console → Cloud Messaging → Web Push Certificates |
   | `VITE_ENABLE_SW` | `true` |

5. Click **Deploy**
6. You get a URL like `https://expenseiq-ammar.vercel.app`

7. Go back to Render → **backend** service → **Environment**:
   - Update `CORS_ORIGIN` → your actual Vercel URL
   - Save → backend redeploys

8. Also update Firebase Console:
   - **Authentication → Settings → Authorized domains** → add your Vercel URL
   - **Cloud Messaging** doesn't need changes (VAPID key works on any domain)

---

## Step 6 — Set up keep-alive (5 min, eliminates cold starts)

Render free services sleep after 15 min of inactivity. A free cron service
pings them every 14 min to keep them awake.

### Option A — cron-job.org (recommended, no code, truly free)

1. Go to **https://cron-job.org** → Sign up free
2. Create Job 1:
   - **URL:** `https://expenseiq-backend.onrender.com/api/health`
   - **Schedule:** Every 14 minutes
   - **Request method:** GET
   - **Title:** ExpenseIQ Backend Keep-Alive
3. Create Job 2:
   - **URL:** `https://expenseiq-ml.onrender.com/health`
   - **Schedule:** Every 14 minutes
   - **Request method:** GET
   - **Title:** ExpenseIQ ML Keep-Alive
4. Enable both jobs → **Save**

That's it. Both services stay warm forever at ₹0.

### Option B — GitHub Actions scheduled ping (also free)

Add this additional job to `.github/workflows/deploy.yml`:

```yaml
  keepalive:
    name: Keep services warm
    runs-on: ubuntu-latest
    # Runs every 14 minutes, 24/7
    # Note: add this as a separate workflow file for clarity
    steps:
      - name: Ping backend
        run: curl -sf https://expenseiq-backend.onrender.com/api/health
      - name: Ping ML service
        run: curl -sf https://expenseiq-ml.onrender.com/health
```

Create `.github/workflows/keepalive.yml`:
```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/14 * * * *'   # every 14 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf https://expenseiq-backend.onrender.com/api/health
      - run: curl -sf https://expenseiq-ml.onrender.com/health
```

> **Note:** GitHub Actions free tier = 2,000 min/month. A ping every 14 min
> = ~3,000 runs/month × ~0.5 min each = ~1,500 min/month. Cuts it close.
> cron-job.org is safer for the keep-alive.

---

## Step 7 — GitHub Actions CI/CD secrets (3 min)

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** for each:

   | Secret name | Where to find it |
   |---|---|
   | `RENDER_API_KEY` | Render → Account Settings (top right avatar) → API Keys → Create API Key |
   | `RENDER_BACKEND_SVC_ID` | Render → your backend service → Settings → Service ID (e.g. `srv-abc123`) |
   | `RENDER_ML_SVC_ID` | Render → your ML service → Settings → Service ID |

3. Push any change to `main` → go to **Actions** tab → watch it run:
   - ✅ Backend TypeScript check
   - ✅ Frontend Vite build
   - ✅ ML Python syntax
   - ✅ Deploy triggered on Render

---

## Step 8 — Run migrations (one-time)

The backend Dockerfile runs `prisma migrate deploy` automatically on startup.
So your Neon database is migrated on the very first deploy.

To verify migrations ran:
```bash
curl https://expenseiq-backend.onrender.com/api/health
# "db":"ok" means Prisma connected to Neon successfully
```

If you ever need to run migrations manually from your local machine:
```bash
cd backend
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

---

## Step 9 — Install as PWA on your phone (2 min)

1. Open your Vercel URL on **Android Chrome**
2. Chrome shows a banner: **"Add ExpenseIQ to Home screen"**
   - Or: tap three-dot menu → "Add to Home screen"
3. Tap **Add** → app appears on home screen with your icon
4. Open it — full screen, no browser bar, feels native
5. Push notifications work (HTTPS is now live ✅)
6. Offline mode works (service worker from Step 7 ✅)

On **iPhone (iOS Safari)**:
1. Open your Vercel URL in Safari
2. Tap the **Share** button (box with arrow) → **"Add to Home Screen"**
3. Tap **Add**

---

## Test locally with Docker before deploying

```bash
# From project root
cp root/.env.production .env    # copy the template
# Edit .env if needed (defaults work for local testing)

docker-compose up --build

# Should see:
#   expenseiq-backend  | [Server] ExpenseIQ backend running on port 5000
#   expenseiq-ml       | Started server process

# Test:
curl http://localhost:5000/api/health
curl http://localhost:8001/health

# Frontend: run normally with Vite (not Docker)
cd frontend && npm run dev
# Open http://localhost:5173
```

---

## Final URLs after deployment

| Service | URL |
|---|---|
| 🌐 App (PWA) | `https://expenseiq-ammar.vercel.app` |
| 🔌 API | `https://expenseiq-backend.onrender.com/api` |
| 🤖 ML | `https://expenseiq-ml.onrender.com` |
| ❤️ Health | `https://expenseiq-backend.onrender.com/api/health` |

Share your Vercel URL with anyone — it works on any device, any browser.
On Android Chrome, they'll be prompted to install it as an app.

---

## Free tier limits summary

| Service | Free Limit | ExpenseIQ Usage | Safe? |
|---|---|---|---|
| Vercel | 100 GB bandwidth | ~1 MB per user per month | ✅ Handles 100,000 users |
| Render backend | 750 hr/month | 720 hr/month if kept warm | ✅ Just fits (14-min pings) |
| Render ML | 750 hr/month | Same | ✅ Same |
| Neon DB | 0.5 GB storage | ~1 KB per expense | ✅ Holds 500,000 expenses |
| GitHub Actions | 2,000 min/month | ~200 min/month (CI only) | ✅ Plenty |
| cron-job.org | Unlimited jobs | 2 jobs at 14-min interval | ✅ Free forever |

**Total cost: ₹0/month, forever.**
