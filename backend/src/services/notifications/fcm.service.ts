/**
 * FCM Service — Firebase Cloud Messaging
 *
 * SETUP (one-time):
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → download JSON
 *   3. Save as: backend/firebase-service-account.json   ← add to .gitignore!
 *   4. npm install firebase-admin
 *   5. Add FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json to .env
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lazy-load firebase-admin — app boots normally even without it
let _messaging: any = null;

function getMessaging() {
  if (_messaging) return _messaging;
  try {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "./firebase-service-account.json";
      admin.initializeApp({ credential: admin.credential.cert(path) });
    }
    _messaging = admin.messaging();
    return _messaging;
  } catch {
    return null; // gracefully degrade if not configured
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationAction {
  action: string; // internal identifier
  title: string;  // label shown on button
  icon?: string;  // optional icon URL (web only)
}

export interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  actions?: NotificationAction[]; // buttons shown directly on notification
}

// ── Core send ────────────────────────────────────────────────────────────────

export async function sendToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const fcm = getMessaging();
  if (!fcm) {
    console.warn("[FCM] Not initialized — skipping send");
    return { sent: 0, failed: 0 };
  }

  const tokens = await prisma.fcmToken.findMany({
    where: { userId },
    select: { id: true, token: true, platform: true },
  });

  if (!tokens.length) return { sent: 0, failed: 0 };

  let sent = 0, failed = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    tokens.map(async ({ id, token, platform }) => {
      try {
        await fcm.send(buildFcmMessage(token, platform, payload));
        sent++;
      } catch (err: any) {
        if (
          err.code === "messaging/invalid-registration-token" ||
          err.code === "messaging/registration-token-not-registered"
        ) {
          stale.push(id);
        }
        failed++;
      }
    })
  );

  if (stale.length) {
    await prisma.fcmToken.deleteMany({ where: { id: { in: stale } } });
  }

  await prisma.notificationLog.create({
    data: { userId, type: payload.type, title: payload.title, body: payload.body },
  });

  return { sent, failed };
}

export async function sendToUsers(userIds: string[], payload: NotificationPayload) {
  await Promise.allSettled(userIds.map((id) => sendToUser(id, payload)));
}

// ── Message builder ──────────────────────────────────────────────────────────

function buildFcmMessage(token: string, platform: string, payload: NotificationPayload) {
  const actionsJson = JSON.stringify(payload.actions ?? []);

  const base = {
    token,
    notification: { title: payload.title, body: payload.body },
    data: { type: payload.type, actions: actionsJson, ...(payload.data ?? {}) },
  };

  if (platform === "android") {
    return {
      ...base,
      android: {
        priority: "high" as const,
        notification: {
          channelId: "expenseiq_main",
          icon: "ic_stat_notification",
          color: "#6366f1",
          // Action buttons rendered natively by the Android FCM SDK
          // They're pulled from data.actions by the service worker
        },
      },
    };
  }

  if (platform === "ios") {
    return {
      ...base,
      apns: {
        payload: {
          aps: {
            alert: { title: payload.title, body: payload.body },
            sound: "default",
            badge: 1,
            "interruption-level": "time-sensitive",
            // iOS 15+: category-based actions (registered in AppDelegate)
            category: payload.actions?.length ? "EXPENSE_ENTRY" : undefined,
          },
        },
      },
    };
  }

  // Web Push (default)
  return {
    ...base,
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        requireInteraction: true, // keeps notification visible until user acts
        actions: (payload.actions ?? []).map((a) => ({
          action: a.action,
          title: a.title,
          ...(a.icon ? { icon: a.icon } : {}),
        })),
      },
      data: base.data,
      fcmOptions: { link: "/" },
    },
  };
}

// ── Token management ─────────────────────────────────────────────────────────

export async function registerToken(
  userId: string,
  token: string,
  platform: "web" | "android" | "ios" = "web"
) {
  await prisma.fcmToken.upsert({
    where: { token },
    update: { userId, platform, updatedAt: new Date() },
    create: { userId, token, platform },
  });
}

export async function removeToken(token: string) {
  await prisma.fcmToken.deleteMany({ where: { token } });
}
