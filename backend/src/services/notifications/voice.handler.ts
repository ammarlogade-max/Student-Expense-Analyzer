/**
 * Voice / Text Expense Parser
 *
 * Parses natural language like "spent 120 on snacks" or "300 food" into
 * a structured expense and saves it to the database.
 *
 * This runs in the background when the user taps the 🎤 or ✏️ button
 * on the 8 PM reminder notification — without opening the app.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ParseResult {
  success: boolean;
  amount?: number;
  category?: string;
  description?: string;
}

// ── Category keyword map ───────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food:          ["food","eat","ate","lunch","dinner","breakfast","snack","snacks","chai","tea","coffee","biryani","pizza","swiggy","zomato","restaurant","cafe","hotel","tiffin"],
  Shopping:      ["shop","shopping","bought","clothes","shirt","jeans","amazon","flipkart","market","mall","shoes","grocery","groceries","vegetables","fruits","sabzi"],
  Transport:     ["auto","rickshaw","bus","train","metro","cab","ola","uber","fuel","petrol","diesel","bike","taxi","ticket","travel"],
  Housing:       ["rent","electricity","water","wifi","internet","maintenance","society","gas","cylinder"],
  Education:     ["book","books","course","fees","college","tuition","coaching","stationary","pen","pencil","exam","notes"],
  Entertainment: ["movie","movies","netflix","game","games","concert","party","outing","hangout","spotify","youtube","fun"],
  Health:        ["medicine","doctor","hospital","pharmacy","chemist","medical","health","tablet","tablets","gym","yoga"],
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

/**
 * Parse natural language expense text.
 *
 * Supports formats like:
 *   "spent 120 on snacks"
 *   "120 rupees food"
 *   "paid 500 for books"
 *   "300 on transport"
 *   "120 snacks"
 */
export function parseExpenseText(text: string): ParseResult {
  const cleaned = text.trim().toLowerCase();

  // Extract amount — look for number (with optional commas/decimals)
  const amountMatch = cleaned.match(/(?:rs\.?|₹|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (!amountMatch) return { success: false };

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) return { success: false };

  const category = detectCategory(cleaned);

  // Extract description — everything after "on" or "for" or "at"
  const descMatch = cleaned.match(/(?:on|for|at)\s+(.+)$/i);
  const description = descMatch ? descMatch[1].trim() : cleaned;

  return { success: true, amount, category, description };
}

/**
 * Parse the text and save the expense to the DB.
 * Called by the notification action handler.
 */
export async function addExpense(userId: string, text: string): Promise<ParseResult> {
  const parsed = parseExpenseText(text);
  if (!parsed.success || !parsed.amount) return { success: false };

  await prisma.expense.create({
    data: {
      userId,
      amount: parsed.amount,
      category: parsed.category ?? "Other",
      description: parsed.description ?? `Voice: ${text}`,
    },
  });

  return parsed;
}
