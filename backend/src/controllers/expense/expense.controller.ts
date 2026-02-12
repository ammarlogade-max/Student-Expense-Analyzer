import { Request, Response } from "express";
import {
  createExpense,
  deleteExpense,
  getUserExpenses,
  getMonthlySummary,
  updateExpense
} from "../../services/expense/expense.service";
import { AppError } from "../../utils/AppError";

export async function addExpense(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const data = req.body;

    const expense = await createExpense({
      userId: user.userId,
      ...data
    });

    return res.status(201).json({
      success: true,
      expense
    });
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}

export async function getExpenses(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { category, startDate, endDate, query, page, limit } = req.query;

    const result = await getUserExpenses(user.userId, {
      category: category as string,
      startDate: startDate as string,
      endDate: endDate as string,
      query: query as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    return res.status(200).json({
      success: true,
      expenses: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch {
    throw new AppError("Failed to fetch expenses", 500);
  }
}

export async function getMonthlyExpenseSummary(
  req: Request,
  res: Response
) {
  try {
    const user = (req as any).user;

    const summary = await getMonthlySummary(user.userId);

    return res.status(200).json({
      success: true,
      summary
    });
  } catch {
    throw new AppError("Failed to fetch monthly summary", 500);
  }
}

export async function updateExpenseItem(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = req.body;

    const updated = await updateExpense(user.userId, id, data);
    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.status(200).json({ success: true, expense: updated });
  } catch {
    throw new AppError("Failed to update expense", 500);
  }
}

export async function deleteExpenseItem(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const deleted = await deleteExpense(user.userId, id);
    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }
    return res.status(200).json({ success: true });
  } catch {
    throw new AppError("Failed to delete expense", 500);
  }
}
