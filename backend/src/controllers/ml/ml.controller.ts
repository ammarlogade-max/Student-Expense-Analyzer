import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import {
  checkMlHealth,
  parseSmsAndPredict,
  predictBatch,
  predictMerchantCategory,
} from "../../services/ml/ml.service";

/**
 * POST /api/ml/predict
 * Body: { merchant: string }
 * Predict the expense category for a merchant name.
 */
export async function predictCategory(req: Request, res: Response) {
  const { merchant } = req.body;
  if (!merchant || typeof merchant !== "string") {
    throw new AppError("merchant (string) is required", 422);
  }

  const result = await predictMerchantCategory(merchant.trim());
  return res.status(200).json({ success: true, ...result });
}

/**
 * POST /api/ml/parse-sms
 * Body: { sms_text: string }
 * Parse SMS + predict category.  Used by SmsParser page.
 */
export async function parseSms(req: Request, res: Response) {
  const sms = req.body?.sms_text ?? req.body?.smsText;
  if (!sms || typeof sms !== "string") {
    throw new AppError("sms_text (or smsText) (string) is required", 422);
  }
  if (sms.length > 5000) {
    throw new AppError("sms_text is too long (max 5000 chars)", 422);
  }

  const sanitizedSms = sms
    // Strip control characters to avoid payload/log injection style issues.
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitizedSms) {
    throw new AppError("sms_text is empty after sanitization", 422);
  }

  const result = await parseSmsAndPredict(sanitizedSms);
  return res.status(200).json({ success: true, result });
}

/**
 * POST /api/ml/batch
 * Body: { merchants: string[] }
 * Categorize up to 500 merchants in one call.
 */
export async function batchPredict(req: Request, res: Response) {
  const { merchants } = req.body;
  if (!Array.isArray(merchants) || merchants.length === 0) {
    throw new AppError("merchants (string[]) is required", 422);
  }

  const result = await predictBatch(merchants);
  return res.status(200).json({ success: true, ...result });
}

/**
 * GET /api/ml/health
 * Returns whether the FastAPI ML service is reachable.
 */
export async function mlHealthCheck(req: Request, res: Response) {
  const healthy = await checkMlHealth();
  return res.status(healthy ? 200 : 503).json({
    success: healthy,
    ml_service: healthy ? "online" : "offline",
  });
}
