/**
 * All 25 notification payload templates for ExpenseIQ.
 * Each factory function returns a ready-to-send NotificationPayload.
 */

import type { NotificationPayload } from "./fcm.service";

// ── 1. Expense Alerts ────────────────────────────────────────────────────────

export function largeExpenseAlert(amount: number, category: string, avgDaily: number): NotificationPayload {
  const mult = avgDaily > 0 ? Math.round(amount / avgDaily) : 0;
  return {
    type: "expense_large",
    title: "Large Expense Detected 💳",
    body: `You just spent ₹${amount.toLocaleString("en-IN")} on ${category}. That's ${mult}x your daily average.`,
    data: { category, amount: String(amount) },
  };
}

export function dailyReminderNoExpense(): NotificationPayload {
  return {
    type: "expense_daily_reminder",
    title: "Did you spend anything today? 📝",
    body: "You haven't logged any expenses yet. Tap to add one before you forget.",
    data: { action_url: "/expenses" },
  };
}

export function expenseConfirmed(amount: number, category: string, balance?: number): NotificationPayload {
  return {
    type: "expense_confirmed",
    title: "Expense Logged ✅",
    body: `₹${amount.toLocaleString("en-IN")} added to ${category}${balance != null ? `. Cash balance: ₹${balance.toLocaleString("en-IN")}` : ""}.`,
    data: { category, amount: String(amount) },
  };
}

// ── 2. Budget Alerts ─────────────────────────────────────────────────────────

export function budget70Alert(spent: number, limit: number): NotificationPayload {
  return {
    type: "budget_70",
    title: "Budget at 70% 🟡",
    body: `You've used ₹${spent.toLocaleString("en-IN")} of your ₹${limit.toLocaleString("en-IN")} monthly budget. Slow down a little.`,
    data: { action_url: "/budget" },
  };
}

export function budget90Alert(spent: number, limit: number): NotificationPayload {
  return {
    type: "budget_90",
    title: "⚠️ Budget Almost Gone!",
    body: `Almost at your limit! ₹${spent.toLocaleString("en-IN")} spent of ₹${limit.toLocaleString("en-IN")}. Pause big purchases now.`,
    data: { action_url: "/budget" },
  };
}

export function budgetExceeded(overBy: number): NotificationPayload {
  return {
    type: "budget_exceeded",
    title: "🚨 Budget Breached!",
    body: `You've gone over your monthly budget by ₹${overBy.toLocaleString("en-IN")}. Review your spending now.`,
    data: { action_url: "/budget" },
  };
}

export function categoryBudget80Alert(category: string, spent: number, limit: number): NotificationPayload {
  return {
    type: "budget_category_80",
    title: `${category} Budget at 80% 🏷️`,
    body: `${category} spending hit ₹${spent.toLocaleString("en-IN")} of your ₹${limit.toLocaleString("en-IN")} limit.`,
    data: { category, action_url: "/budget" },
  };
}

export function categoryBudgetExceeded(category: string, overBy: number): NotificationPayload {
  return {
    type: "budget_category_exceeded",
    title: `🚨 ${category} Budget Exceeded`,
    body: `${category} budget exceeded by ₹${overBy.toLocaleString("en-IN")} this month.`,
    data: { category, action_url: "/budget" },
  };
}

// ── 3. Cash Wallet Alerts ────────────────────────────────────────────────────

export function lowCashAlert(balance: number): NotificationPayload {
  return {
    type: "cash_low",
    title: "Cash Wallet Running Low 💵",
    body: `Only ₹${balance.toLocaleString("en-IN")} remaining in your cash wallet. Time to top up?`,
    data: { action_url: "/cash" },
  };
}

export function cashNotTracked(withdrawn: number, logged: number): NotificationPayload {
  const gap = withdrawn - logged;
  return {
    type: "cash_untracked",
    title: "Untracked Cash Detected 🔍",
    body: `You withdrew ₹${withdrawn.toLocaleString("en-IN")} but only logged ₹${logged.toLocaleString("en-IN")}. ₹${gap.toLocaleString("en-IN")} is unaccounted for.`,
    data: { gap: String(gap), action_url: "/cash" },
  };
}

export function weeklyReconciliation(withdrawn: number, logged: number): NotificationPayload {
  const gap = withdrawn - logged;
  return {
    type: "cash_weekly_reconcile",
    title: "Weekly Cash Check 📊",
    body: `This week: ₹${withdrawn.toLocaleString("en-IN")} withdrawn, ₹${logged.toLocaleString("en-IN")} logged. ₹${gap.toLocaleString("en-IN")} gap found.`,
    data: { gap: String(gap), action_url: "/cash" },
  };
}

// ── 4. Finance Score Alerts ──────────────────────────────────────────────────

export function scoreImproved(newScore: number, level: string): NotificationPayload {
  return {
    type: "score_improved",
    title: "🎉 Score Improved!",
    body: `Your Finance Score jumped to ${newScore}! You've reached the ${level} level. Keep it up!`,
    data: { score: String(newScore), level, action_url: "/score" },
  };
}

export function scoreDropped(delta: number): NotificationPayload {
  return {
    type: "score_dropped",
    title: "Score Dropped 📉",
    body: `Your Finance Score dropped ${Math.abs(delta)} pts. Check your budget and logging habit to bounce back.`,
    data: { delta: String(delta), action_url: "/score" },
  };
}

export function levelUp(newLevel: string, emoji: string): NotificationPayload {
  return {
    type: "score_level_up",
    title: `${emoji} Level Up — You're ${newLevel}!`,
    body: `Congratulations! You've unlocked the ${newLevel} tier. Keep your habits consistent to stay here.`,
    data: { level: newLevel, action_url: "/score" },
  };
}

export function streakMilestone(days: number, bonus: number): NotificationPayload {
  return {
    type: "score_streak",
    title: `🔥 ${days}-Day Streak!`,
    body: `${days} days of consistent logging! +${bonus} Consistency bonus points earned. Don't stop now.`,
    data: { streak: String(days), bonus: String(bonus), action_url: "/score" },
  };
}

export function streakAtRisk(days: number): NotificationPayload {
  return {
    type: "score_streak_risk",
    title: `Don't Break Your ${days}-Day Streak! ⏰`,
    body: `Log at least one expense before midnight to keep your ${days}-day streak alive.`,
    data: { streak: String(days), action_url: "/expenses" },
  };
}

// ── 5. Weekly & Monthly Reports ──────────────────────────────────────────────

export function weeklySummary(total: number, topCategory: string, topAmount: number): NotificationPayload {
  return {
    type: "report_weekly",
    title: "Your Weekly Report 📊",
    body: `This week: ₹${total.toLocaleString("en-IN")} spent. ${topCategory} was your top category (₹${topAmount.toLocaleString("en-IN")}).`,
    data: { action_url: "/analytics" },
  };
}

export function monthEndReport(month: string, total: number, count: number, score: number): NotificationPayload {
  return {
    type: "report_month_end",
    title: `${month} Wrap-Up 🗓️`,
    body: `${month}: ₹${total.toLocaleString("en-IN")} spent, ${count} expenses logged. Finance Score: ${score}.`,
    data: { action_url: "/analytics" },
  };
}

export function monthStartReset(month: string, limit: number): NotificationPayload {
  return {
    type: "report_month_start",
    title: `Fresh Start — ${month} 🌅`,
    body: `New month, fresh budget! Your ${month} limit resets to ₹${limit.toLocaleString("en-IN")}. Make it count.`,
    data: { action_url: "/budget" },
  };
}

// ── 6. SMS Parser Alerts ─────────────────────────────────────────────────────

export function smsParsedSuccess(amount: number, merchant: string, category: string): NotificationPayload {
  return {
    type: "sms_parsed",
    title: "Bank SMS Auto-Logged 📱",
    body: `₹${amount.toLocaleString("en-IN")} at ${merchant} logged as ${category} automatically.`,
    data: { amount: String(amount), merchant, category },
  };
}

export function smsParseFailure(): NotificationPayload {
  return {
    type: "sms_parse_failed",
    title: "Couldn't Parse SMS 🤔",
    body: "We couldn't read your bank SMS automatically. Tap to log it manually.",
    data: { action_url: "/sms-parser" },
  };
}

// ── 7. Evening Cash Reminder — THE SPECIAL ONE ───────────────────────────────
// Sent every night at 8 PM if no cash expense was logged since 2 PM
// AND no SMS transaction was detected. Includes Voice + Text action buttons.

export function eveningCashReminder(): NotificationPayload {
  return {
    type: "evening_reminder",
    title: "Did you spend any cash today? 💸",
    body: "No cash expenses detected since afternoon. Just say or type what you spent — we'll log it!",
    data: {
      action_url: "/expenses",
      reminder_type: "evening_cash",
    },
    // These two buttons appear directly on the notification on Android & Web
    // Users can speak or type without opening the app
    actions: [
      {
        action: "voice_entry",
        title: "🎤 Speak",
        icon: "/icons/mic.png",
      },
      {
        action: "text_entry",
        title: "✏️ Type",
        icon: "/icons/pencil.png",
      },
    ],
  };
}

// ── 8. Behavioral Insights ───────────────────────────────────────────────────

export function spendingPatternInsight(day: string, suggestion: number): NotificationPayload {
  return {
    type: "insight_pattern",
    title: "Spending Pattern Spotted 💡",
    body: `You tend to overspend on ${day}s. Budget an extra ₹${suggestion} this ${day} to stay on track.`,
    data: { day, action_url: "/analytics" },
  };
}

export function categorySpikeInsight(category: string, pctUp: number): NotificationPayload {
  return {
    type: "insight_spike",
    title: `${category} Spending Up ${pctUp}% 📈`,
    body: `${category} spending is ${pctUp}% higher this week vs last. Check if there's a pattern.`,
    data: { category, pctUp: String(pctUp), action_url: "/analytics" },
  };
}

export function savingsOpportunityInsight(
  category: string,
  currentDaily: number,
  targetDaily: number
): NotificationPayload {
  const saving = Math.round((currentDaily - targetDaily) * 30);
  return {
    type: "insight_savings",
    title: "Savings Opportunity 💰",
    body: `Cutting ${category} from ₹${currentDaily}/day to ₹${targetDaily}/day could save ₹${saving} this month.`,
    data: { category, saving: String(saving), action_url: "/analytics" },
  };
}
