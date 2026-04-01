import type { Request, Response } from "express";
import prisma from "../../config/prisma";
import { parseSmsAndPredict } from "../../services/ml/ml.service";

const CONFIDENCE_THRESHOLD = 0.6;
const FALLBACK_DEBIT_THRESHOLD = 0.55;

function hasClearDebitPattern(smsText: string): boolean {
  const lower = smsText.toLowerCase();
  const hasDebitVerb = /\b(debited|spent|paid|purchase|txn|transaction|withdrawn|dr\.?)\b/.test(lower);
  const hasAmount = /(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d{1,2})?/i.test(smsText);
  const isCreditOnly = /\b(credited|salary|refund|cashback|interest)\b/.test(lower) && !hasDebitVerb;
  return hasDebitVerb && hasAmount && !isCreditOnly;
}

type AuthReq = Request & { user?: { userId: string; email: string } };

export async function autoIngestSms(req: AuthReq, res: Response) {
  const userId = req.user?.userId;
  const smsText = req.body?.smsText;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!smsText || typeof smsText !== "string") {
    return res.status(400).json({ error: "smsText is required" });
  }

  if (smsText.length > 5000) {
    return res.status(400).json({ error: "smsText too long (max 5000 chars)" });
  }

  try {
    const parsed = await parseSmsAndPredict(smsText);

    const amount = parsed.amount ? Number(parsed.amount) : null;
    const merchant = parsed.merchant || null;
    const category = parsed.category || "Other";
    const confidence = Number(parsed.confidence || 0);
    const date = parsed.date || null;

    if (!amount || Number.isNaN(amount) || amount <= 0 || parsed.type === "cash_withdrawal") {
      return res.json({
        saved: false,
        amount: null,
        merchant: null,
        category: null,
        confidence: 0,
        date,
        rawSms: smsText,
        reason: "no_valid_expense",
      });
    }

    const isClearDebit = hasClearDebitPattern(smsText);
    const shouldAutoSave = confidence >= CONFIDENCE_THRESHOLD || (isClearDebit && confidence >= FALLBACK_DEBIT_THRESHOLD);

    if (shouldAutoSave) {
      const expense = await prisma.expense.create({
        data: {
          userId,
          amount,
          category: category || "Other",
          description: merchant?.trim() ? merchant : "Bank debit SMS",
          source: "sms",
        },
      });

      return res.json({
        saved: true,
        amount,
        merchant,
        category,
        confidence,
        date,
        rawSms: smsText,
        expenseId: expense.id,
      });
    }

    return res.json({
      saved: false,
      amount,
      merchant,
      category,
      confidence,
      date,
      rawSms: smsText,
      reason: "low_confidence",
    });
  } catch (err) {
    console.error("[SMS auto-ingest]", err);
    return res.status(500).json({ error: "Failed to process SMS" });
  }
}

export async function confirmSmsCategory(req: AuthReq, res: Response) {
  const userId = req.user?.userId;
  const { amount, merchant, category } = req.body ?? {};

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!amount || !category) {
    return res.status(400).json({ error: "amount and category are required" });
  }

  const amountNum = Number(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: "amount must be a valid positive number" });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: amountNum,
        category: String(category),
        description: merchant ? String(merchant) : "SMS import",
        source: "sms",
      },
    });

    return res.json({ saved: true, expenseId: expense.id });
  } catch (err) {
    console.error("[SMS confirm]", err);
    return res.status(500).json({ error: "Failed to save expense" });
  }
}
