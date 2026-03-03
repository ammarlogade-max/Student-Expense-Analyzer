import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createCashAdjustment,
  createCashExpense,
  createCashExpenseFromVoice,
  createCashWithdrawal,
  getCashWallet,
  getWeeklyReconciliation,
  listCashTransactions,
  runWeeklyReconciliationNow
} from "../../controllers/cash/cash.controller";
import {
  cashAdjustmentSchema,
  cashExpenseSchema,
  cashTxQuerySchema,
  cashVoiceSchema,
  cashWithdrawalSchema
} from "../../validators/cash.validator";

const router = Router();

router.get("/wallet", authenticate, getCashWallet);
router.get(
  "/transactions",
  authenticate,
  validate({ query: cashTxQuerySchema }),
  listCashTransactions
);
router.post(
  "/withdrawals",
  authenticate,
  requireCsrf,
  validate({ body: cashWithdrawalSchema }),
  createCashWithdrawal
);
router.post(
  "/expenses",
  authenticate,
  requireCsrf,
  validate({ body: cashExpenseSchema }),
  createCashExpense
);
router.post(
  "/adjustments",
  authenticate,
  requireCsrf,
  validate({ body: cashAdjustmentSchema }),
  createCashAdjustment
);
router.post(
  "/voice-entry",
  authenticate,
  requireCsrf,
  validate({ body: cashVoiceSchema }),
  createCashExpenseFromVoice
);
router.get("/reconciliation/weekly", authenticate, getWeeklyReconciliation);
router.post("/reconciliation/run-now", authenticate, requireCsrf, runWeeklyReconciliationNow);

export default router;

