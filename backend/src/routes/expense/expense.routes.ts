import { Router } from "express";
import {
  addExpense,
  deleteExpenseItem,
  getExpenses,
  getMonthlyExpenseSummary,
  updateExpenseItem
} from "../../controllers/expense/expense.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  expenseParamSchema,
  expenseQuerySchema,
  expenseSchema,
  expenseUpdateSchema
} from "../../validators/expense.validator";

const router = Router();

router.post("/", authenticate, requireCsrf, validate({ body: expenseSchema }), addExpense);
router.get("/", authenticate, validate({ query: expenseQuerySchema }), getExpenses);
router.patch(
  "/:id",
  authenticate,
  requireCsrf,
  validate({ params: expenseParamSchema, body: expenseUpdateSchema }),
  updateExpenseItem
);
router.delete(
  "/:id",
  authenticate,
  requireCsrf,
  validate({ params: expenseParamSchema }),
  deleteExpenseItem
);

// Analytics
router.get("/summary/monthly", authenticate, getMonthlyExpenseSummary);

export default router;
