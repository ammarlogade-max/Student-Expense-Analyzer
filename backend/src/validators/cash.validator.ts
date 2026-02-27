import { z } from "zod";

export const cashExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(["manual", "voice", "sms"]).optional()
});

export const cashWithdrawalSchema = z.object({
  amount: z.number().positive(),
  source: z.enum(["manual", "sms"]).optional(),
  note: z.string().optional()
});

export const cashAdjustmentSchema = z.object({
  amount: z.number(),
  note: z.string().optional()
});

export const cashVoiceSchema = z.object({
  transcript: z.string().min(1)
});

export const cashTxQuerySchema = z.object({
  type: z.enum(["withdrawal", "expense", "adjustment"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

