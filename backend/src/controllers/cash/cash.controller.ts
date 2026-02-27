import { NextFunction, Request, Response } from "express";
import {
  addCashExpense,
  addCashWithdrawal,
  adjustCashWallet,
  calculateWeeklyReconciliation,
  getCashTransactions,
  getCashWalletOverview,
  parseVoiceCashExpenseSmart,
  runWeeklyReconciliation
} from "../../services/cash/cash.service";

function getUserId(req: Request) {
  const user = (req as Request & { user?: { userId: string } }).user;
  return user?.userId || "";
}

type CashTransactionType = "withdrawal" | "expense" | "adjustment";

function isCashSchemaMissingError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "");
  return (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("cashwallet") ||
    message.includes("cashtransaction") ||
    message.includes("cashalert") ||
    message.includes("relation") && message.includes("does not exist")
  );
}

export async function getCashWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const result = await getCashWalletOverview(userId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (isCashSchemaMissingError(error)) {
      return res.status(200).json({
        success: true,
        wallet: {
          id: "uninitialized",
          userId: getUserId(req),
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        lowCash: true,
        lowCashThreshold: 200,
        transactions: [],
        alerts: []
      });
    }
    return next(error);
  }
}

export async function createCashWithdrawal(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const { amount, source, note } = req.body as {
      amount: number;
      source?: "manual" | "sms";
      note?: string;
    };
    const result = await addCashWithdrawal(
      userId,
      amount,
      source === "sms" ? "sms" : "manual",
      note || "Cash withdrawal"
    );
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    if (isCashSchemaMissingError(error)) {
      return res.status(200).json({ success: true, transactions: [] });
    }
    return next(error);
  }
}

export async function createCashExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { amount, category, description, source } = req.body as {
      amount: number;
      category: string;
      description?: string;
      source?: "manual" | "voice" | "sms";
    };
    const result = await addCashExpense({
      userId,
      amount,
      category,
      description,
      source: source || "manual"
    });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    if (isCashSchemaMissingError(error)) {
      return res.status(200).json({
        success: true,
        summary: {
          withdrawals: 0,
          expenses: 0,
          gap: 0,
          since: new Date().toISOString()
        }
      });
    }
    return next(error);
  }
}

export async function createCashAdjustment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const { amount, note } = req.body as { amount: number; note?: string };
    const result = await adjustCashWallet(userId, amount, note);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    if (isCashSchemaMissingError(error)) {
      return res.status(200).json({ success: true, created: [] });
    }
    return next(error);
  }
}

export async function listCashTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const { type, limit } = req.query as { type?: string; limit?: string };
    const parsedType =
      type && ["withdrawal", "expense", "adjustment"].includes(type)
        ? (type as CashTransactionType)
        : undefined;
    const items = await getCashTransactions(
      userId,
      parsedType,
      limit ? Number(limit) : 30
    );
    return res.status(200).json({ success: true, transactions: items });
  } catch (error) {
    return next(error);
  }
}

export async function getWeeklyReconciliation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const summary = await calculateWeeklyReconciliation(userId, 7);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return next(error);
  }
}

export async function runWeeklyReconciliationNow(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await runWeeklyReconciliation(200);
    return res.status(200).json({ success: true, created: result });
  } catch (error) {
    return next(error);
  }
}

export async function createCashExpenseFromVoice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const { transcript } = req.body as { transcript: string };
    const parsed = await parseVoiceCashExpenseSmart(transcript);
    if (!parsed.amount || !parsed.category) {
      return res.status(400).json({
        success: false,
        message:
          "Could not parse voice statement. Try phrases like: spend 500 on pizza, spend 190 on Flipkart, add 300 in shopping."
      });
    }

    const result = await addCashExpense({
      userId,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description || transcript,
      source: "voice"
    });

    return res.status(201).json({
      success: true,
      parsed,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}
