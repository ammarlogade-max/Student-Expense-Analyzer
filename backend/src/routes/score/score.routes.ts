import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import {
  getHistory,
  getScore,
  recalculateScore
} from "../../controllers/score/score.controller";

const router = Router();

router.get("/", authenticate, getScore);
router.get("/history", authenticate, getHistory);
router.post("/recalculate", authenticate, recalculateScore);

export default router;
