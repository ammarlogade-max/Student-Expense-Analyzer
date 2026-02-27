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
  const { sms_text } = req.body;
  if (!sms_text || typeof sms_text !== "string") {
    throw new AppError("sms_text (string) is required", 422);
  }

  const result = await parseSmsAndPredict(sms_text.trim());
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