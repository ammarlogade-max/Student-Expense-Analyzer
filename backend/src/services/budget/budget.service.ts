import prisma from "../../config/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetData {
  monthlyLimit: number;
  categoryBudgets: Record<string, number>;
}

// ─── Get or create budget ─────────────────────────────────────────────────────
// If the user has never set a budget, we return defaults (all zeros).
// This way the frontend always gets a valid object back.

export async function getOrCreateBudget(userId: string): Promise<BudgetData & { id: string }> {
  const budget = await prisma.budget.upsert({
    where: { userId },
    update: {},                         // don't change anything if it already exists
    create: {
      userId,
      monthlyLimit: 0,
      categoryBudgets: {}
    }
  });

  return {
    id: budget.id,
    monthlyLimit: budget.monthlyLimit,
    categoryBudgets: (budget.categoryBudgets as Record<string, number>) ?? {}
  };
}

// ─── Update budget ────────────────────────────────────────────────────────────
// User can update their monthly limit, category budgets, or both at once.

export async function updateBudget(
  userId: string,
  data: Partial<BudgetData>
): Promise<BudgetData & { id: string }> {
  const budget = await prisma.budget.upsert({
    where: { userId },
    update: {
      ...(data.monthlyLimit !== undefined && { monthlyLimit: data.monthlyLimit }),
      ...(data.categoryBudgets !== undefined && { categoryBudgets: data.categoryBudgets })
    },
    create: {
      userId,
      monthlyLimit: data.monthlyLimit ?? 0,
      categoryBudgets: data.categoryBudgets ?? {}
    }
  });

  return {
    id: budget.id,
    monthlyLimit: budget.monthlyLimit,
    categoryBudgets: (budget.categoryBudgets as Record<string, number>) ?? {}
  };
}

// ─── Budget status ────────────────────────────────────────────────────────────
// Returns how much the user has spent this month vs their budget.
// This is used by the frontend to show the progress bar and alerts.

export async function getBudgetStatus(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get budget settings
  const budget = await getOrCreateBudget(userId);

  // Get all expenses for this month
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  // Calculate total spent this month
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate spent per category
  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
  });

  // Calculate remaining budget
  const remaining = budget.monthlyLimit - totalSpent;

  // Calculate percentage used (cap at 100 so UI doesn't overflow)
  const percentUsed =
    budget.monthlyLimit > 0
      ? Math.min(100, (totalSpent / budget.monthlyLimit) * 100)
      : 0;

  // Check which categories are over budget
  const categoryStatus: Record<string, {
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    isOver: boolean;
  }> = {};

  Object.entries(budget.categoryBudgets).forEach(([category, limit]) => {
    const spent = spentByCategory[category] || 0;
    categoryStatus[category] = {
      limit,
      spent,
      remaining: limit - spent,
      percentUsed: limit > 0 ? Math.min(100, (spent / limit) * 100) : 0,
      isOver: spent > limit && limit > 0
    };
  });

  return {
    monthlyLimit: budget.monthlyLimit,
    categoryBudgets: budget.categoryBudgets,
    totalSpent,
    remaining,
    percentUsed,
    spentByCategory,
    categoryStatus,
    isOverBudget: totalSpent > budget.monthlyLimit && budget.monthlyLimit > 0,
    isNearLimit: percentUsed >= 80 && percentUsed < 100
  };
}