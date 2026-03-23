import { z } from "zod";

const paymentModeSchema = z.enum(["CASH", "DIGITAL"]);

export const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  paymentMode: paymentModeSchema.optional(),
  description: z.string().optional()
});

export const expenseUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  paymentMode: paymentModeSchema.optional(),
  description: z.string().optional()
});

export const expenseParamSchema = z.object({
  id: z.string().min(1)
});

export const expenseQuerySchema = z.object({
  category: z.string().optional(),
  paymentMode: paymentModeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  query: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});
