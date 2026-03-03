import { Request, Response } from "express";
import {
  calculateScore,
  saveScore,
  getScoreHistory,
  getLevel,
  LEVELS,
} from "../../services/score/score.engine";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── GET /api/score ─────────────────────────────────────────────────────────────
// Returns today's score. Calculates fresh + persists if not already saved today.
export const getScore = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Check if we already have today's score cached
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let cached = await prisma.financeScore.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Recalculate if stale (older than 30 mins) or missing
    const shouldRecalculate =
      !cached ||
      Date.now() - new Date(cached.date).getTime() > 30 * 60 * 1000;

    let breakdown;
    if (shouldRecalculate) {
      breakdown = await calculateScore(userId);
      await saveScore(userId, breakdown);
    } else {
      // Reconstruct from DB
      const levelData = getLevel(cached!.totalScore);
      breakdown = {
        totalScore:       cached!.totalScore,
        level:            cached!.level,
        levelEmoji:       levelData.emoji,
        levelColor:       levelData.color,
        consistencyScore: cached!.consistencyScore,
        budgetScore:      cached!.budgetScore,
        cashScore:        cached!.cashScore,
        savingsScore:     cached!.savingsScore,
        streak:           cached!.streak,
        weeklyDelta:      cached!.weeklyDelta,
        insight:          cached!.insight,
      };
    }

    // Progress to next level
    const currentLevel = LEVELS.find((l) => l.name === breakdown.level)!;
    const nextLevel    = LEVELS[LEVELS.indexOf(currentLevel) + 1] ?? null;
    const progressToNext = nextLevel
      ? Math.round(((breakdown.totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return res.json({
      score: breakdown,
      levels: LEVELS,
      progressToNext,
      nextLevel: nextLevel?.name ?? null,
      nextLevelEmoji: nextLevel?.emoji ?? null,
    });
  } catch (err: any) {
    console.error("[getScore]", err);
    return res.status(500).json({ error: "Failed to calculate score" });
  }
};

// ── GET /api/score/history?days=30 ────────────────────────────────────────────
// Returns score history for trend chart
export const getHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));

  try {
    const history = await getScoreHistory(userId, days);
    return res.json({ history });
  } catch (err: any) {
    console.error("[getHistory]", err);
    return res.status(500).json({ error: "Failed to fetch score history" });
  }
};

// ── POST /api/score/recalculate ────────────────────────────────────────────────
// Force-recalculate and persist (called after adding expense, updating budget etc.)
export const recalculateScore = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const breakdown = await calculateScore(userId);
    await saveScore(userId, breakdown);

    const currentLevel   = LEVELS.find((l) => l.name === breakdown.level)!;
    const nextLevel      = LEVELS[LEVELS.indexOf(currentLevel) + 1] ?? null;
    const progressToNext = nextLevel
      ? Math.round(((breakdown.totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return res.json({
      score: breakdown,
      progressToNext,
      nextLevel: nextLevel?.name ?? null,
    });
  } catch (err: any) {
    console.error("[recalculateScore]", err);
    return res.status(500).json({ error: "Failed to recalculate score" });
  }
};
