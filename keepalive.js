/**
 * keepalive.js — Prevent Render free tier cold starts
 *
 * Render free services spin down after 15 minutes of inactivity.
 * This script pings both services every 14 minutes to keep them warm.
 *
 * TWO OPTIONS to run this (pick one):
 *
 * Option A — cron-job.org (recommended, truly free, no server needed)
 *   See README Step 6 for setup. You create 2 jobs on their website.
 *   No code needed — just paste your URLs into their form.
 *
 * Option B — Run this script on any Node.js host (e.g. a Raspberry Pi,
 *   your laptop when it's on, or a free GitHub Actions scheduled workflow)
 *
 * Usage (Option B):
 *   node keepalive.js
 */

const SERVICES = [
  {
    name:    "Backend",
    url:     "https://expenseiq-backend.onrender.com/api/health",
    expect:  200,
  },
  {
    name:    "ML Service",
    url:     "https://expenseiq-ml.onrender.com/health",
    expect:  200,
  },
];

const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

async function ping(service) {
  const start = Date.now();
  try {
    const res = await fetch(service.url, {
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });
    const ms = Date.now() - start;
    const ok = res.status === service.expect;
    console.log(
      `[${new Date().toISOString()}] ${ok ? "✅" : "⚠️"} ${service.name} — ${res.status} in ${ms}ms`
    );
  } catch (err) {
    const ms = Date.now() - start;
    console.error(
      `[${new Date().toISOString()}] ❌ ${service.name} — ERROR in ${ms}ms:`,
      err.message
    );
  }
}

async function pingAll() {
  await Promise.all(SERVICES.map(ping));
}

// Ping immediately on start, then every 14 minutes
console.log(`[Keep-Alive] Starting — pinging ${SERVICES.length} services every 14 min`);
pingAll();
setInterval(pingAll, INTERVAL_MS);
