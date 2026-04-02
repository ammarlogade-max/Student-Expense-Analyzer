import type { Request } from "express";
import prisma from "../../config/prisma";
import { env } from "../../config/env";
import { recordUserActivity } from "../activity/activity.service";

type MLRequestKind = "PREDICT_CATEGORY" | "PARSE_SMS";

type MLRequestOptions = {
  userId?: string;
  req?: Request;
  shouldLog?: boolean;
};

const ML_BASE_URL = (env as any).ML_SERVICE_URL ?? "http://localhost:8001";
const TIMEOUT_MS = 5000;

export interface MerchantPrediction {
  merchant: string;
  category: string;
  confidence: number;
  used_model: boolean;
}

export interface SmsPrediction {
  amount: string | null;
  date: string | null;
  merchant: string;
  category: string;
  confidence: number;
  type: "expense" | "cash_withdrawal";
  used_model: boolean;
}

export interface BatchPrediction {
  results: MerchantPrediction[];
  count: number;
  duration_ms: number;
}

function isLikelyDateToken(value: string): boolean {
  const v = value.trim();
  return (
    /^\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?$/.test(v) ||
    /^\d{1,2}-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i.test(v)
  );
}

function extractMerchantFromSmsText(smsText: string): string | null {
  const m =
    smsText.match(/\bat\s+([A-Za-z][A-Za-z0-9&.\- ]{1,40})(?=\.|,|\s(?:avl|bal|on|using|via|ref)\b|$)/i) ||
    smsText.match(/\bto\s+([A-Za-z][A-Za-z0-9&.\- ]{1,40})(?=\.|,|\s(?:avl|bal|on|using|via|ref)\b|$)/i);
  return m?.[1]?.trim() || null;
}

function normalizeSmsPrediction(parsed: SmsPrediction, smsText: string): SmsPrediction {
  let merchant = (parsed.merchant || "").trim();

  if (!merchant || isLikelyDateToken(merchant)) {
    const merchantFromText = extractMerchantFromSmsText(smsText);
    if (merchantFromText) {
      merchant = merchantFromText;
    }
  }

  const category =
    parsed.type === "cash_withdrawal"
      ? "Other"
      : parsed.category && parsed.category !== "Uncategorized"
        ? parsed.category
        : ruleBasedCategory(merchant || smsText);

  return {
    ...parsed,
    merchant,
    category
  };
}

async function mlFetch<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ML service ${path} returned ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function ruleBasedCategory(merchant: string): string {
  const v = merchant.toLowerCase();
  if (/zomato|swiggy|food|restaurant|cafe|pizza|burger|biryani|kfc|domino|starbucks|tea|snack/.test(v)) return "Food";
  if (/uber|ola|rapido|metro|bus|auto|petrol|fuel|irctc|indigo|spicejet/.test(v)) return "Travel";
  if (/amazon|flipkart|myntra|zara|shopping|store|mall|meesho|ajio/.test(v)) return "Shopping";
  if (/doctor|pharmacy|apollo|medplus|hospital|clinic|1mg|netmeds|health/.test(v)) return "Health";
  if (/netflix|hotstar|prime|spotify|bookmyshow|pvr|inox|cinema|game/.test(v)) return "Entertainment";
  if (/college|school|course|udemy|fees|tuition|book|byju|unacademy/.test(v)) return "Education";
  if (/rent|pg|hostel|housing|maintenance/.test(v)) return "Housing";
  return "Other";
}

function ruleBasedSms(smsText: string): SmsPrediction {
  const amountMatch  = smsText.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const dateMatch    = smsText.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
  const merchantMatch = smsText.match(
    /(?:at|to|for|on)\s+([A-Za-z0-9\s&.\-]+?)(?=\.|at|on|using|via|txn|ref|$)/i
  );
  const bankSuffixMatch = smsText.match(/-\s*([A-Za-z][A-Za-z0-9]{2,})\s*$/);
  const isAtm = /atm|cash\s*withdraw/i.test(smsText);

  const merchant = merchantMatch ? merchantMatch[1].trim() : bankSuffixMatch ? bankSuffixMatch[1].trim() : "";
  return {
    amount:     amountMatch ? amountMatch[1].replace(/,/g, "") : null,
    date:       dateMatch ? dateMatch[1] : null,
    merchant,
    category: isAtm ? "Other" : ruleBasedCategory(merchant),
    confidence: 0,
    type: isAtm ? "cash_withdrawal" : "expense",
    used_model: false
  };
}

async function logMLRequest(input: {
  requestType: MLRequestKind;
  merchant?: string;
  category?: string;
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  rawResponse?: unknown;
  userId?: string;
}) {
  await prisma.mLLog.create({
    data: {
      requestType: input.requestType,
      merchant: input.merchant,
      category: input.category,
      success: input.success,
      responseTimeMs: input.responseTimeMs,
      errorMessage: input.errorMessage,
      rawResponse: input.rawResponse as any,
      userId: input.userId
    }
  });
}

export async function checkMlHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function predictMerchantCategory(
  merchant: string,
  options: MLRequestOptions = {}
): Promise<MerchantPrediction> {
  const startedAt = Date.now();

  try {
    const result = await mlFetch<MerchantPrediction>("/predict/merchant", { merchant });
    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PREDICT_CATEGORY",
        merchant,
        category: result.category,
        success: true,
        responseTimeMs: Date.now() - startedAt,
        rawResponse: result,
        userId: options.userId
      });
    }
    return result;
  } catch (error) {
    const fallback: MerchantPrediction = {
      merchant,
      category: ruleBasedCategory(merchant),
      confidence: 0,
      used_model: false
    };

    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PREDICT_CATEGORY",
        merchant,
        category: fallback.category,
        success: true,
        responseTimeMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
        rawResponse: fallback,
        userId: options.userId
      });
    }

    return fallback;
  }
}

export async function parseSmsAndPredict(
  smsText: string,
  options: MLRequestOptions = {}
): Promise<SmsPrediction> {
  const startedAt = Date.now();

  try {
    const rawResult = await mlFetch<SmsPrediction>("/predict/sms", { sms_text: smsText });
    const result = normalizeSmsPrediction(rawResult, smsText);

    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PARSE_SMS",
        merchant: result.merchant,
        category: result.category,
        success: true,
        responseTimeMs: Date.now() - startedAt,
        rawResponse: result,
        userId: options.userId
      });

      if (options.userId) {
        await recordUserActivity({
          userId: options.userId,
          action: "SMS_IMPORT",
          feature: "sms-parser",
          description: "Imported SMS for expense extraction",
          metadata: {
            merchant: result.merchant,
            category: result.category
          },
          req: options.req
        });
      }
    }

    return result;
  } catch (error) {
    const fallback = normalizeSmsPrediction(ruleBasedSms(smsText), smsText);

    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PARSE_SMS",
        merchant: fallback.merchant,
        category: fallback.category,
        success: true,
        responseTimeMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
        rawResponse: fallback,
        userId: options.userId
      });

      if (options.userId) {
        await recordUserActivity({
          userId: options.userId,
          action: "SMS_IMPORT",
          feature: "sms-parser",
          description: "Imported SMS for expense extraction",
          metadata: {
            merchant: fallback.merchant,
            category: fallback.category
          },
          req: options.req
        });
      }
    }

    return fallback;
  }
}

export async function predictBatch(
  merchants: string[]
): Promise<BatchPrediction> {
  try {
    return await mlFetch<BatchPrediction>("/predict/batch", { merchants });
  } catch {
    const results = merchants.map((merchant) => ({
      merchant,
      category: ruleBasedCategory(merchant),
      confidence: 0,
      used_model: false
    }));
    return { results, count: results.length, duration_ms: 0 };
  }
}

export async function probeMlService() {
  const startedAt = Date.now();

  try {
    await predictMerchantCategory("Amazon", { shouldLog: false });
    return {
      status: "healthy",
      responseTimeMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTimeMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}
