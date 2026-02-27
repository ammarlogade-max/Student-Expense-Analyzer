import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getBudget,
  getBudgetStatusHandler,
  updateBudgetHandler
} from "../../controllers/budget/budget.controller";
import { budgetUpdateSchema } from "../../validators/budget.validator";

const router = Router();

// GET  /api/budget          → get current budget settings
// GET  /api/budget/status   → get full budget status (spent, remaining, categories)
// PATCH /api/budget         → update budget settings

router.get("/", authenticate, getBudget);
router.get("/status", authenticate, getBudgetStatusHandler);
router.patch("/", authenticate, validate({ body: budgetUpdateSchema }), updateBudgetHandler);

export default router;