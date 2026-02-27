import { Request, Response, NextFunction } from "express";
import {
  getBudgetStatus,
  getOrCreateBudget,
  updateBudget
} from "../../services/budget/budget.service";
import { AppError } from "../../utils/AppError";

// Helper to get userId from the authenticated request
function getUserId(req: Request): string {
  const user = (req as Request & { user?: { userId: string } }).user;
  return user?.userId || "";
}

// ─── GET /api/budget ──────────────────────────────────────────────────────────
// Returns the user's budget settings (monthly limit + category budgets)
export async function getBudget(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const budget = await getOrCreateBudget(userId);
    return res.status(200).json({ success: true, budget });
  } catch (error) {
    return next(new AppError("Failed to fetch budget", 500));
  }
}

// ─── GET /api/budget/status ───────────────────────────────────────────────────
// Returns full budget status: spent, remaining, percent used, category breakdown
export async function getBudgetStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const status = await getBudgetStatus(userId);
    return res.status(200).json({ success: true, status });
  } catch (error) {
    return next(new AppError("Failed to fetch budget status", 500));
  }
}

// ─── PATCH /api/budget ────────────────────────────────────────────────────────
// Updates monthly limit and/or category budgets
export async function updateBudgetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { monthlyLimit, categoryBudgets } = req.body;

    const budget = await updateBudget(userId, {
      ...(monthlyLimit !== undefined && { monthlyLimit: Number(monthlyLimit) }),
      ...(categoryBudgets !== undefined && { categoryBudgets })
    });

    return res.status(200).json({ success: true, budget });
  } catch (error) {
    return next(new AppError("Failed to update budget", 500));
  }
}