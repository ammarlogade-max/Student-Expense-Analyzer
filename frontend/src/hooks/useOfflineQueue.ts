/**
 * useOfflineQueue — queue expense POSTs when offline, replay when online
 *
 * Usage:
 *   const { addExpense } = useOfflineQueue();
 *   await addExpense({ amount: 120, category: "Food", description: "Lunch" });
 *
 * If online  → posts directly to API
 * If offline → saves to IndexedDB, registers background sync tag
 *              SW picks it up and replays when connection returns
 */

import { useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { getCsrfToken, getToken } from "../lib/storage";

const DB_NAME    = "expenseiq-offline";
const STORE_NAME = "queue";
const DB_VERSION = 1;

interface QueuedExpense {
  expense: { amount: number; category: string; description?: string };
  token: string;
  queuedAt: string;
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function enqueue(item: QueuedExpense): Promise<void> {
  const db = await openDB();
  await new Promise<void>((res, rej) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).add(item);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOfflineQueue() {
  const { push } = useToast();

  const addExpense = useCallback(
    async (expense: { amount: number; category: string; description?: string }) => {
      const token = getToken() ?? "";
      const csrf = getCsrfToken() ?? "";

      if (navigator.onLine) {
        // Normal path — post directly
        const res = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/expenses`,
          {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-csrf-token": csrf,
            },
            body:    JSON.stringify(expense),
          }
        );
        if (!res.ok) throw new Error("Failed to add expense");
        return await res.json();
      }

      // Offline path — save to IndexedDB + register background sync
      await enqueue({ expense, token, queuedAt: new Date().toISOString() });

      if ("serviceWorker" in navigator && "SyncManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register("sync-expenses");
      }

      push(
        `₹${expense.amount} saved offline — will sync when you're back online`,
          "info"
      );

      return { offline: true, expense };
    },
    [push]
  );

  return { addExpense };
}
