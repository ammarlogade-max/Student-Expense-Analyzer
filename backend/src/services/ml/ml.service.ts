/**
 * ml.service.ts  —  Step 3 rewrite
 *
 * Before: spawned a new Python child process per request  →  2–4 s latency
 * After:  HTTP call to FastAPI service (model loaded once) →  ~10 ms latency
 *
 * The FastAPI server lives at ML_SERVICE_URL (default http://localhost:8001).
 * If the service is down we fall back to a fast rule-based categorizer so
 * the rest of the app never breaks.
 */

import { env } from "../../config/env";

// ── Config ─────────────────────────────────────────────────────────────────────
const ML_BASE_URL = (env as any).ML_SERVICE_URL ?? "http://localhost:8001";
const TIMEOUT_MS  = 5_000;   // abort if FastAPI doesn't respond in 5 s

// ── Types (mirror FastAPI response schemas) ────────────────────────────────────
export interface MerchantPrediction {
  merchant:    string;
  category:    string;
  confidence:  number;
  used_model:  boolean;
}

export interface SmsPrediction {
  amount:      string | null;
  date:        string | null;
  merchant:    string;
  category:    string;
  confidence:  number;
  type:        "expense" | "cash_withdrawal";
  used_model:  boolean;
}

export interface BatchPrediction {
  results:     MerchantPrediction[];
  count:       number;
  duration_ms: number;
}

// ── Shared fetch helper with timeout ─────────────────────────────────────────
async function mlFetch<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_BASE_URL}${path}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  controller.signal,
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

// ── Rule-based fallback (used if FastAPI is unreachable) ──────────────────────
function ruleBasedCategory(merchant: string): string {
  const v = merchant.toLowerCase();
  if (/zomato|swiggy|food|restaurant|cafe|pizza|burger|biryani|kfc|domino|starbucks|tea|snack/.test(v))
    return "Food";
  if (/uber|ola|rapido|metro|bus|auto|petrol|fuel|irctc|indigo|spicejet/.test(v))
    return "Travel";
  if (/amazon|flipkart|myntra|zara|shopping|store|mall|meesho|ajio/.test(v))
    return "Shopping";
  if (/doctor|pharmacy|apollo|medplus|hospital|clinic|1mg|netmeds|health/.test(v))
    return "Health";
  if (/netflix|hotstar|prime|spotify|bookmyshow|pvr|inox|cinema|game/.test(v))
    return "Entertainment";
  if (/college|school|course|udemy|fees|tuition|book|byju|unacademy/.test(v))
    return "Education";
  if (/rent|pg|hostel|housing|maintenance/.test(v))
    return "Housing";
  return "Other";
}

// Simple SMS amount/merchant regex fallback
function ruleBasedSms(smsText: string): SmsPrediction {
  const amountMatch  = smsText.match(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)/i);
  const dateMatch    = smsText.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
  const merchantMatch = smsText.match(
    /(?:at|to|for|on)\s+([A-Za-z0-9\s&.\-]+?)(?=\.|at|on|using|via|txn|ref|$)/i
  );
  const isAtm = /atm|cash\s*withdraw/i.test(smsText);

  const merchant = merchantMatch ? merchantMatch[1].trim() : "";
  return {
    amount:     amountMatch  ? amountMatch[1]  : null,
    date:       dateMatch    ? dateMatch[1]    : null,
    merchant,
    category:   isAtm ? "Other" : ruleBasedCategory(merchant),
    confidence: 0,
    type:       isAtm ? "cash_withdrawal" : "expense",
    used_model: false,
  };
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function checkMlHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Predict the expense category for a single merchant name.
 * Falls back to rule-based if FastAPI is unreachable.
 */
export async function predictMerchantCategory(
  merchant: string
): Promise<MerchantPrediction> {
  try {
    return await mlFetch<MerchantPrediction>("/predict/merchant", { merchant });
  } catch (err) {
    console.warn(`[ml.service] FastAPI unreachable, using rule fallback: ${err}`);
    return {
      merchant,
      category:   ruleBasedCategory(merchant),
      confidence: 0,
      used_model: false,
    };
  }
}

/**
 * Parse an SMS string and predict category.
 * Falls back to regex + rule-based if FastAPI is unreachable.
 */
export async function parseSmsAndPredict(smsText: string): Promise<SmsPrediction> {
  try {
    return await mlFetch<SmsPrediction>("/predict/sms", { sms_text: smsText });
  } catch (err) {
    console.warn(`[ml.service] FastAPI unreachable, using rule fallback: ${err}`);
    return ruleBasedSms(smsText);
  }
}

/**
 * Categorize many merchants in a single round-trip.
 * Useful for bulk re-categorization or import flows.
 */
export async function predictBatch(
  merchants: string[]
): Promise<BatchPrediction> {
  try {
    return await mlFetch<BatchPrediction>("/predict/batch", { merchants });
  } catch (err) {
    console.warn(`[ml.service] FastAPI unreachable, using rule fallback for batch`);
    const results = merchants.map((merchant) => ({
      merchant,
      category:   ruleBasedCategory(merchant),
      confidence: 0,
      used_model: false,
    }));
    return { results, count: results.length, duration_ms: 0 };
  }
}