import { z } from "zod";

export const featureUsageSchema = z.object({
  feature: z.string().min(2),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});
