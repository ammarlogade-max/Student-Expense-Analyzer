import { z } from "zod";

// Validator for updating budget settings
// Both fields are optional so user can update just one at a time
export const budgetUpdateSchema = z.object({
  monthlyLimit: z.number().min(0, "Monthly limit cannot be negative").optional(),
  categoryBudgets: z
    .record(z.string(), z.number().min(0, "Category budget cannot be negative"))
    .optional()
});