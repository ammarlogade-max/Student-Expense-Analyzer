import type { Request, Response } from "express";
import { registerToken, removeToken, sendToUser } from "../../services/notifications/fcm.service";
import { eveningCashReminder } from "../../services/notifications/notification.payloads";
import { PrismaClient } from "@prisma/client";
import { addExpense } from "../../services/notifications/voice.handler";

const prisma = new PrismaClient();

/**
 * POST /api/notifications/token
 * Registers or refreshes the FCM token for the authenticated user.
 * Called from the frontend after FCM.getToken() on load.
 */
export async function registerFcmToken(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { token, platform = "web" } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "token is required" });
  }
  if (!["web", "android", "ios"].includes(platform)) {
    return res.status(400).json({ error: "invalid platform" });
  }

  await registerToken(userId, token, platform);
  return res.json({ message: "Token registered" });
}

/**
 * DELETE /api/notifications/token
 * Removes the FCM token on logout (so no more notifications for this device).
 */
export async function removeFcmToken(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token is required" });

  await removeToken(token);
  return res.json({ message: "Token removed" });
}

/**
 * GET /api/notifications/history
 * Returns the last 50 notifications sent to this user.
 */
export async function getNotificationHistory(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const logs = await prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: { id: true, type: true, title: true, body: true, sentAt: true },
  });

  return res.json({ notifications: logs });
}

/**
 * POST /api/notifications/action
 * Handles notification action button taps — the core of the 8 PM reminder flow.
 *
 * When the user taps 🎤 Speak or ✏️ Type on the evening notification,
 * the service worker sends the transcribed text here.
 * We parse it and log the expense in the background.
 *
 * Body: { action: "voice_entry" | "text_entry", text: "spent 120 on snacks" }
 */
export async function handleNotificationAction(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { action, text } = req.body;

  if (!action || !text) {
    return res.status(400).json({ error: "action and text are required" });
  }

  try {
    const result = await addExpense(userId, text);

    if (result.success) {
      // Send a quiet confirmation notification
      await sendToUser(userId, {
        type: "expense_confirmed",
        title: "✅ Expense Logged!",
        body: `₹${result.amount?.toLocaleString("en-IN")} logged as ${result.category}. Good night! 🌙`,
        data: { amount: String(result.amount), category: result.category ?? "" },
      });

      return res.json({
        success: true,
        expense: { amount: result.amount, category: result.category },
      });
    }

    return res.status(422).json({ error: "Could not parse expense from text", raw: text });
  } catch (err) {
    return res.status(500).json({ error: "Failed to log expense" });
  }
}

/**
 * POST /api/notifications/test  (dev only)
 * Manually trigger the 8 PM reminder for testing.
 */
export async function testEveningReminder(req: Request, res: Response) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Dev only" });
  }
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const result = await sendToUser(userId, eveningCashReminder());
  return res.json({ result });
}
