import { Request, Response } from "express";
import prisma from "../../config/prisma";
import {
  calculateScore,
  getLevel,
  getScoreHistory,
  LEVELS,
  saveScore
} from "../../services/score/score.engine";

const getUserId = (req: Request): string => {
  const user = (req as Request & { user?: { userId: string } }).user;
  return user?.userId || "";
};

export const getScore = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const cached = await prisma.financeScore.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    let breakdown;
    if (!cached) {
      breakdown = await calculateScore(userId);
      await saveScore(userId, breakdown);
    } else {
      const levelData = getLevel(cached.totalScore);
      breakdown = {
        totalScore: cached.totalScore,
        level: cached.level,
        levelEmoji: levelData.emoji,
        levelColor: levelData.color,
        consistencyScore: cached.consistencyScore,
        budgetScore: cached.budgetScore,
        cashScore: cached.cashScore,
        savingsScore: cached.savingsScore,
        streak: cached.streak,
        weeklyDelta: cached.weeklyDelta,
        insight: cached.insight
      };
    }

    const currentLevel = LEVELS.find((l) => l.name === breakdown.level) ?? LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] ?? null;
    const progressToNext = nextLevel
      ? Math.round(((breakdown.totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return res.json({
      score: breakdown,
      levels: LEVELS,
      progressToNext,
      nextLevel: nextLevel?.name ?? null,
      nextLevelEmoji: nextLevel?.emoji ?? null
    });
  } catch (err) {
    console.error("[getScore]", err);
    return res.status(500).json({ error: "Failed to calculate score" });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));

  try {
    const history = await getScoreHistory(userId, days);
    return res.json({ history });
  } catch (err) {
    console.error("[getHistory]", err);
    return res.status(500).json({ error: "Failed to fetch score history" });
  }
};

export const recalculateScore = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const breakdown = await calculateScore(userId);
    await saveScore(userId, breakdown);

    const currentLevel = LEVELS.find((l) => l.name === breakdown.level) ?? LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] ?? null;
    const progressToNext = nextLevel
      ? Math.round(((breakdown.totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return res.json({
      score: breakdown,
      levels: LEVELS,
      progressToNext,
      nextLevel: nextLevel?.name ?? null,
      nextLevelEmoji: nextLevel?.emoji ?? null
    });
  } catch (err) {
    console.error("[recalculateScore]", err);
    return res.status(500).json({ error: "Failed to recalculate score" });
  }
};
