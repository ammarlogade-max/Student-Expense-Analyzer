#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

config({ path: resolve(root, ".env.production") });
config({ path: resolve(root, ".env") });

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error("inject-sw-env: Missing env vars:", missing.join(", "));
  process.exit(1);
}

const swPath = resolve(root, "dist", "firebase-messaging-sw.js");
let sw;
try {
  sw = readFileSync(swPath, "utf-8");
} catch {
  console.error(`inject-sw-env: Could not read ${swPath}`);
  process.exit(1);
}

const replacements = {
  __FIREBASE_API_KEY__: process.env.VITE_FIREBASE_API_KEY,
  __FIREBASE_AUTH_DOMAIN__: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  __FIREBASE_PROJECT_ID__: process.env.VITE_FIREBASE_PROJECT_ID,
  __FIREBASE_STORAGE_BUCKET__: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  __FIREBASE_MESSAGING_SENDER_ID__: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  __FIREBASE_APP_ID__: process.env.VITE_FIREBASE_APP_ID,
};

for (const [placeholder, value] of Object.entries(replacements)) {
  sw = sw.replaceAll(placeholder, String(value));
}

const unresolved = Object.keys(replacements).filter((placeholder) => sw.includes(placeholder));
if (unresolved.length > 0) {
  console.error("inject-sw-env: Some placeholders were not replaced:", unresolved.join(", "));
  process.exit(1);
}

writeFileSync(swPath, sw, "utf-8");
console.log("inject-sw-env: Firebase config injected into dist/firebase-messaging-sw.js");
