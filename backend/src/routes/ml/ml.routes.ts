import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import {
  predictCategory,
  parseSms,
  batchPredict,
  mlHealthCheck,
} from "../../controllers/ml/ml.controller";

const router = Router();

// Predict category for a single merchant name
// POST /api/ml/predict   { merchant: string }
router.post("/predict", authenticate, predictCategory);

// Parse SMS text and predict category
// POST /api/ml/parse-sms   { sms_text: string }
router.post("/parse-sms", authenticate, parseSms);

// Batch categorise multiple merchants in one call
// POST /api/ml/batch   { merchants: string[] }
router.post("/batch", authenticate, batchPredict);

// Is the FastAPI ML service reachable?
// GET /api/ml/health   (no auth — used by monitoring / healthchecks)
router.get("/health", mlHealthCheck);

export default router;