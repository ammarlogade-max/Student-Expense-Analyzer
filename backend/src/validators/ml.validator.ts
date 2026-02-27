import { z } from "zod";

export const predictSchema = z.object({
  merchant: z.string().min(1)
});

export const parseSmsSchema = z.object({
  smsText: z.string().min(1)
});

export const ingestSmsSchema = z.object({
  smsText: z.string().min(1)
});
