import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Step 7 — PWA vite config
 *
 * No vite-plugin-pwa used intentionally — we manage the service worker
 * manually (sw.js) so it coexists cleanly with firebase-messaging-sw.js.
 *
 * Changes from original:
 *   - build.rollupOptions: chunk splitting for better caching
 *   - build.sourcemap: true in dev for easier debugging
 *   - server.headers: required for SW registration in dev
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    headers: {
      // Required for SharedArrayBuffer + precise SW scope in dev
      "Service-Worker-Allowed": "/",
    },
  },

  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better long-term caching
        manualChunks: {
          react:    ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
          firebase: ["firebase/app", "firebase/messaging"],
        },
      },
    },
  },

  // Make sure sw.js and manifest.json in /public are never transformed
  publicDir: "public",
});
