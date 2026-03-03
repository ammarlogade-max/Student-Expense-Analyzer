/**
 * Notification Scheduler — runs all 25 notification triggers on their schedules.
 *
 * All cron times are in UTC. India (IST) = UTC + 5:30
 *   8:00 PM IST = 14:30 UTC
 *  11:45 PM IST = 18:15 UTC
 *  10:00 AM IST = 04:30 UTC
 */

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendToUser, sendToUsers } from "../services/notifications/fcm.service";
import * as P from "../services/notifications/notification.payloads";

const prisma = new PrismaClient();

// ── Helper: get IST date string ───────────────────────────────────────────────
function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function currentMonthIST() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return { month: ist.getMonth() + 1, year: ist.getFullYear() };
}

// ── 1. Daily No-Log Reminder — 10:00 PM IST (16:30 UTC) ─────────────────────
// Sent if user hasn't logged a single expense today
function scheduleDailyLogReminder() {
  cron.schedule("30 16 * * *", async () => {
    console.log("[Notifications] Running daily log reminder check...");
    const today = todayIST();

    const usersWithTokens = await prisma.fcmToken.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });

    for (const { userId } of usersWithTokens) {
      const count = await prisma.expense.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(`${today}T00:00:00+05:30`),
            lte: new Date(`${today}T23:59:59+05:30`),
          },
        },
      });
      if (count === 0) {
        await sendToUser(userId, P.dailyReminderNoExpense());
      }
    }
  });
  console.log("[Notifications] Daily log reminder — 10:00 PM IST");
}

// ── 2. Evening Cash Reminder — 8:00 PM IST (14:30 UTC) — EVERY DAY ──────────
// The special notification with Voice + Text action buttons.
// Only fires if no cash expense logged since 2 PM IST.
function scheduleEveningCashReminder() {
  cron.schedule("30 14 * * *", async () => {
    console.log("[Notifications] Running 8 PM evening cash reminder...");

    const twoPmIST = new Date();
    twoPmIST.setHours(8, 30, 0, 0); // 2 PM IST = 08:30 UTC

    const usersWithTokens = await prisma.fcmToken.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });

    for (const { userId } of usersWithTokens) {
      // Check if any cash or manual expense logged since 2 PM
      const recentCash = await prisma.expense.count({
        where: {
          userId,
          createdAt: { gte: twoPmIST },
          // Cash expenses often come from manual or voice entry
        },
      });

      // Also check CashTransactions since 2 PM
      const recentCashTxn = await prisma.cashTransaction.count({
        where: {
          userId,
          createdAt: { gte: twoPmIST },
          type: "expense",
        },
      });

      // Send reminder if nothing logged since 2 PM
      if (recentCash === 0 && recentCashTxn === 0) {
        await sendToUser(userId, P.eveningCashReminder());
      }
    }

    console.log("[Notifications] Evening cash reminders sent");
  });
  console.log("[Notifications] Evening cash reminder — 8:00 PM IST daily");
}

// ── 3. Budget Threshold Checks — every hour ───────────────────────────────────
// Runs every hour and checks if any user crossed 70% or 90% budget
function scheduleBudgetChecks() {
  cron.schedule("0 * * * *", async () => {
    const { month, year } = currentMonthIST();

    const usersWithBudget = await prisma.budget.findMany({
      where: { monthlyLimit: { gt: 0 } },
      select: { userId: true, monthlyLimit: true },
    });

    for (const { userId, monthlyLimit } of usersWithBudget) {
      if (monthlyLimit <= 0) continue;

      // Total spent this month
      const startOfMonth = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`);
      const agg = await prisma.expense.aggregate({
        where: { userId, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      });
      const spent = agg._sum.amount ?? 0;
      const pct = (spent / monthlyLimit) * 100;

      // Check what was already notified today to avoid spam
      const today = todayIST();
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          userId,
          type: { in: ["budget_70", "budget_90", "budget_exceeded"] },
          sentAt: { gte: new Date(`${today}T00:00:00+05:30`) },
        },
      });

      if (!alreadySent) {
        if (pct >= 100) {
          await sendToUser(userId, P.budgetExceeded(Math.round(spent - monthlyLimit)));
        } else if (pct >= 90) {
          await sendToUser(userId, P.budget90Alert(Math.round(spent), Math.round(monthlyLimit)));
        } else if (pct >= 70) {
          await sendToUser(userId, P.budget70Alert(Math.round(spent), Math.round(monthlyLimit)));
        }
      }
    }
  });
  console.log("[Notifications] Budget threshold checks — every hour");
}

// ── 4. Streak-at-Risk — 9:00 PM IST (15:30 UTC) ─────────────────────────────
// Warns users with an active streak who haven't logged today
function scheduleStreakRiskCheck() {
  cron.schedule("30 15 * * *", async () => {
    console.log("[Notifications] Checking streaks at risk...");
    const today = todayIST();

    const scores = await prisma.financeScore.findMany({
      where: { streak: { gt: 2 } }, // Only warn if streak > 2 days
      orderBy: { date: "desc" },
      distinct: ["userId"],
      select: { userId: true, streak: true },
    });

    for (const { userId, streak } of scores) {
      const loggedToday = await prisma.expense.count({
        where: {
          userId,
          createdAt: { gte: new Date(`${today}T00:00:00+05:30`) },
        },
      });

      if (loggedToday === 0) {
        await sendToUser(userId, P.streakAtRisk(streak));
      }
    }
  });
  console.log("[Notifications] Streak risk check — 9:00 PM IST");
}

// ── 5. Weekly Summary — Sunday 11:00 AM IST (05:30 UTC) ─────────────────────
function scheduleWeeklySummary() {
  cron.schedule("30 5 * * 0", async () => {
    console.log("[Notifications] Sending weekly summaries...");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const usersWithTokens = await prisma.fcmToken.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });

    for (const { userId } of usersWithTokens) {
      const expenses = await prisma.expense.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        select: { amount: true, category: true },
      });

      if (!expenses.length) continue;

      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const byCat: Record<string, number> = {};
      expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] ?? 0) + e.amount; });
      const [topCat, topAmt] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

      await sendToUser(userId, P.weeklySummary(Math.round(total), topCat, Math.round(topAmt)));
    }
  });
  console.log("[Notifications] Weekly summary — Sunday 11:00 AM IST");
}

// ── 6. Month-End Report — Last day of month, 9:00 PM IST (15:30 UTC) ─────────
function scheduleMonthEndReport() {
  // Run daily and check if today is the last day of the month
  cron.schedule("30 15 * * *", async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() !== lastDay) return;

    console.log("[Notifications] Sending month-end reports...");
    const { month, year } = currentMonthIST();
    const monthName = now.toLocaleString("en-IN", { month: "long" });
    const startOfMonth = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`);

    const usersWithTokens = await prisma.fcmToken.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });

    for (const { userId } of usersWithTokens) {
      const expenses = await prisma.expense.findMany({
        where: { userId, createdAt: { gte: startOfMonth } },
        select: { amount: true },
      });

      if (!expenses.length) continue;

      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const score = await prisma.financeScore.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: { totalScore: true },
      });

      await sendToUser(
        userId,
        P.monthEndReport(monthName, Math.round(total), expenses.length, score?.totalScore ?? 0)
      );
    }
  });
  console.log("[Notifications] Month-end report — last day of month at 9 PM IST");
}

// ── 7. Month-Start Reset — 1st of month, 9:00 AM IST (03:30 UTC) ─────────────
function scheduleMonthStartReset() {
  cron.schedule("30 3 1 * *", async () => {
    console.log("[Notifications] Sending month-start reset notifications...");
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const monthName = now.toLocaleString("en-IN", { month: "long" });
    const usersWithBudget = await prisma.budget.findMany({
      where: { monthlyLimit: { gt: 0 } },
      select: { userId: true, monthlyLimit: true },
    });

    for (const { userId, monthlyLimit } of usersWithBudget) {
      await sendToUser(userId, P.monthStartReset(monthName, Math.round(monthlyLimit)));
    }
  });
  console.log("[Notifications] Month-start reset — 1st of month 9 AM IST");
}

// ── 8. Weekly Behavioral Insights — Saturday 7:00 PM IST (13:30 UTC) ─────────
function scheduleWeeklyInsights() {
  cron.schedule("30 13 * * 6", async () => {
    console.log("[Notifications] Sending weekly behavioral insights...");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const usersWithTokens = await prisma.fcmToken.findMany({
      distinct: ["userId"],
      select: { userId: true },
    });

    for (const { userId } of usersWithTokens) {
      const thisWeek = await prisma.expense.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        select: { amount: true, category: true, createdAt: true },
      });

      if (thisWeek.length < 3) continue;

      const lastWeek = await prisma.expense.findMany({
        where: { userId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
        select: { amount: true, category: true },
      });

      // Category spike detection
      const thisByCat: Record<string, number> = {};
      thisWeek.forEach((e) => { thisByCat[e.category] = (thisByCat[e.category] ?? 0) + e.amount; });
      const lastByCat: Record<string, number> = {};
      lastWeek.forEach((e) => { lastByCat[e.category] = (lastByCat[e.category] ?? 0) + e.amount; });

      for (const [cat, amt] of Object.entries(thisByCat)) {
        const prev = lastByCat[cat] ?? 0;
        if (prev > 0 && amt / prev > 1.3) {
          const pctUp = Math.round(((amt - prev) / prev) * 100);
          await sendToUser(userId, P.categorySpikeInsight(cat, pctUp));
          break; // Only one insight per user per week
        }
      }
    }
  });
  console.log("[Notifications] Weekly insights — Saturday 7:00 PM IST");
}

// ── 9. Weekly Cash Reconciliation — Sunday 10:00 AM IST (04:30 UTC) ──────────
function scheduleWeeklyCashReconcile() {
  cron.schedule("30 4 * * 0", async () => {
    console.log("[Notifications] Running weekly cash reconciliation...");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const usersWithWallets = await prisma.cashWallet.findMany({
      select: { userId: true },
    });

    for (const { userId } of usersWithWallets) {
      const withdrawals = await prisma.cashTransaction.aggregate({
        where: { userId, type: "withdrawal", createdAt: { gte: weekAgo } },
        _sum: { amount: true },
      });
      const expenses = await prisma.cashTransaction.aggregate({
        where: { userId, type: "expense", createdAt: { gte: weekAgo } },
        _sum: { amount: true },
      });

      const withdrawn = withdrawals._sum.amount ?? 0;
      const logged = expenses._sum.amount ?? 0;
      const gap = withdrawn - logged;

      if (gap > 100) {
        // Only notify if gap is significant (> ₹100)
        await sendToUser(userId, P.weeklyReconciliation(Math.round(withdrawn), Math.round(logged)));
      }
    }
  });
  console.log("[Notifications] Weekly cash reconciliation — Sunday 10:00 AM IST");
}

// ── Main export: registers all schedulers ────────────────────────────────────

export function startNotificationScheduler() {
  scheduleDailyLogReminder();
  scheduleEveningCashReminder();   // ← THE SPECIAL 8 PM ONE
  scheduleBudgetChecks();
  scheduleStreakRiskCheck();
  scheduleWeeklySummary();
  scheduleMonthEndReport();
  scheduleMonthStartReset();
  scheduleWeeklyInsights();
  scheduleWeeklyCashReconcile();

  console.log("[NotificationScheduler] All notification jobs registered ✅");
}
