import prisma from "../../config/prisma";

const MAX_SUB = 25;

export interface ScoreBreakdown {
  totalScore: number;
  level: string;
  levelEmoji: string;
  levelColor: string;
  consistencyScore: number;
  budgetScore: number;
  cashScore: number;
  savingsScore: number;
  streak: number;
  weeklyDelta: number;
  insight: string;
}

export const LEVELS = [
  { name: "Broke", min: 0, max: 19, emoji: "😬", color: "#ff4d6d", desc: "Just getting started" },
  { name: "Aware", min: 20, max: 39, emoji: "👀", color: "#ffb930", desc: "Building awareness" },
  { name: "Steady", min: 40, max: 59, emoji: "📈", color: "#60a5fa", desc: "Finding your rhythm" },
  { name: "Smart", min: 60, max: 79, emoji: "🧠", color: "#00e5c3", desc: "Making smart choices" },
  { name: "Legend", min: 80, max: 100, emoji: "🏆", color: "#c8ff00", desc: "Elite financial habits" }
] as const;

export function getLevel(score: number) {
  return LEVELS.find((l) => score >= l.min && score <= l.max) ?? LEVELS[0];
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

async function calcConsistencyScore(userId: string): Promise<{ score: number; streak: number }> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: { userId, createdAt: { gte: monthStart } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" }
  });

  if (expenses.length === 0) return { score: 0, streak: 0 };

  const loggedDays = new Set(expenses.map((e) => e.createdAt.toISOString().slice(0, 10)));
  const today = new Date().toISOString().slice(0, 10);
  const loggedToday = loggedDays.has(today);

  let streak = 0;
  const checkDate = new Date();
  if (!loggedToday) checkDate.setDate(checkDate.getDate() - 1);

  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (loggedDays.has(dateStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const daysThisMonth = new Date().getDate();
  const coverageRatio = loggedDays.size / daysThisMonth;

  let score = 0;
  if (loggedToday) score += 10;
  score += Math.min(10, streak);
  if (coverageRatio >= 0.9) score += 5;

  return { score: Math.min(MAX_SUB, score), streak };
}

async function calcBudgetScore(userId: string): Promise<number> {
  const budget = await prisma.budget.findUnique({ where: { userId } });
  if (!budget || budget.monthlyLimit === 0) return 12;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const agg = await prisma.expense.aggregate({
    where: { userId, createdAt: { gte: monthStart } },
    _sum: { amount: true }
  });

  const spent = agg._sum.amount ?? 0;
  const ratio = spent / budget.monthlyLimit;

  if (ratio <= 0.7) return 25;
  if (ratio <= 0.9) return 18;
  if (ratio <= 1.0) return 10;

  const overshootPct = (ratio - 1) * 100;
  return Math.max(0, 10 - Math.floor(overshootPct / 5));
}

async function calcCashScore(userId: string): Promise<number> {
  const wallet = await prisma.cashWallet.findUnique({ where: { userId } });
  if (!wallet) return 12;

  const unresolvedAlerts = await prisma.cashAlert.count({
    where: { userId, isResolved: false }
  });

  let score = 0;
  if (unresolvedAlerts === 0) score += 15;
  else score = Math.max(0, score - unresolvedAlerts * 5);

  if (wallet.balance >= 500) score += 10;
  else if (wallet.balance >= 200) score += 5;

  return Math.min(MAX_SUB, score);
}

async function calcSavingsScore(userId: string): Promise<number> {
  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);
  const today = startOfDay(new Date());

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, createdAt: { gte: thisWeekStart, lt: today } },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { userId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
      _sum: { amount: true }
    })
  ]);

  const thisTotal = thisWeek._sum.amount ?? 0;
  const lastTotal = lastWeek._sum.amount ?? 0;

  if (lastTotal === 0) return 12;

  const changeRatio = (thisTotal - lastTotal) / lastTotal;

  if (changeRatio <= -0.1) return 25;
  if (changeRatio <= 0.1) return 15;
  if (changeRatio <= 0.3) return 8;
  return 0;
}

async function generateInsight(
  userId: string,
  breakdown: Omit<ScoreBreakdown, "insight" | "level" | "levelEmoji" | "levelColor">
): Promise<string> {
  const weekStart = daysAgo(7);
  const topCats = await prisma.expense.groupBy({
    by: ["category"],
    where: { userId, createdAt: { gte: weekStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 1
  });

  const topCat = topCats[0];

  if (breakdown.streak >= 7) return `🔥 ${breakdown.streak}-day streak! You're in the top habit zone.`;
  if (breakdown.streak === 0) return "Log today to start your streak and boost your score.";
  if (breakdown.budgetScore >= 20) return "Budget hero! You're well within your monthly limit.";
  if (breakdown.budgetScore <= 5) return "Over budget this month - try logging before you spend.";
  if (breakdown.savingsScore >= 20 && topCat) return "Great week! Spending down vs last week. Keep it up.";
  if (breakdown.savingsScore === 0 && topCat) return `${topCat.category} spending up this week - watch it.`;
  if (breakdown.cashScore <= 5) return "Cash gaps detected! Resolve alerts to boost your score.";
  if (breakdown.consistencyScore >= 20) return `${breakdown.streak}-day streak going strong!`;

  return "Keep logging daily to unlock a higher rank!";
}

export async function calculateScore(userId: string): Promise<ScoreBreakdown> {
  const [{ score: consistencyScore, streak }, budgetScore, cashScore, savingsScore] = await Promise.all([
    calcConsistencyScore(userId),
    calcBudgetScore(userId),
    calcCashScore(userId),
    calcSavingsScore(userId)
  ]);

  const totalScore = consistencyScore + budgetScore + cashScore + savingsScore;
  const levelData = getLevel(totalScore);

  const weekAgo = daysAgo(7);
  const oldScore = await prisma.financeScore.findUnique({
    where: { userId_date: { userId, date: weekAgo } },
    select: { totalScore: true }
  });

  const weeklyDelta = oldScore ? totalScore - oldScore.totalScore : 0;

  const partial = {
    totalScore,
    consistencyScore,
    budgetScore,
    cashScore,
    savingsScore,
    streak,
    weeklyDelta
  };

  const insight = await generateInsight(userId, partial);

  return {
    ...partial,
    level: levelData.name,
    levelEmoji: levelData.emoji,
    levelColor: levelData.color,
    insight
  };
}

export async function saveScore(userId: string, breakdown: ScoreBreakdown): Promise<void> {
  const today = startOfDay(new Date());
  const levelData = getLevel(breakdown.totalScore);

  await prisma.financeScore.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      totalScore: breakdown.totalScore,
      level: levelData.name,
      consistencyScore: breakdown.consistencyScore,
      budgetScore: breakdown.budgetScore,
      cashScore: breakdown.cashScore,
      savingsScore: breakdown.savingsScore,
      streak: breakdown.streak,
      weeklyDelta: breakdown.weeklyDelta,
      insight: breakdown.insight
    },
    create: {
      userId,
      date: today,
      totalScore: breakdown.totalScore,
      level: levelData.name,
      consistencyScore: breakdown.consistencyScore,
      budgetScore: breakdown.budgetScore,
      cashScore: breakdown.cashScore,
      savingsScore: breakdown.savingsScore,
      streak: breakdown.streak,
      weeklyDelta: breakdown.weeklyDelta,
      insight: breakdown.insight
    }
  });
}

export async function getScoreHistory(
  userId: string,
  days = 30
): Promise<Array<{ date: string; score: number; level: string }>> {
  const from = daysAgo(days);
  const records = await prisma.financeScore.findMany({
    where: { userId, date: { gte: from } },
    orderBy: { date: "asc" },
    select: { date: true, totalScore: true, level: true }
  });

  return records.map((r: { date: Date; totalScore: number; level: string }) => ({
    date: r.date.toISOString().slice(0, 10),
    score: r.totalScore,
    level: r.level
  }));
}
