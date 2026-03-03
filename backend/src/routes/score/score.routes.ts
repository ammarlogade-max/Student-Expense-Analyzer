import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import {
  getScore,
  getHistory,
  recalculateScore
} from "../../controllers/score/score.controller";

const router = Router();

router.get("/", authenticate, getScore);
router.get("/history", authenticate, getHistory);
router.post("/recalculate", authenticate, requireCsrf, recalculateScore);

export default router;
