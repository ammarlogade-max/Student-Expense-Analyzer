import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
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
  validate({ body: cashWithdrawalSchema }),
  createCashWithdrawal
);
router.post(
  "/expenses",
  authenticate,
  validate({ body: cashExpenseSchema }),
  createCashExpense
);
router.post(
  "/adjustments",
  authenticate,
  validate({ body: cashAdjustmentSchema }),
  createCashAdjustment
);
router.post(
  "/voice-entry",
  authenticate,
  validate({ body: cashVoiceSchema }),
  createCashExpenseFromVoice
);
router.get("/reconciliation/weekly", authenticate, getWeeklyReconciliation);
router.post("/reconciliation/run-now", authenticate, runWeeklyReconciliationNow);

export default router;

