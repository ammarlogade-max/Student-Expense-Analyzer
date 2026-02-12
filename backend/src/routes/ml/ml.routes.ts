import { Router } from "express";
import { parseSms, predictCategory } from "../../controllers/ml/ml.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { parseSmsSchema, predictSchema } from "../../validators/ml.validator";

const router = Router();

router.post("/predict", authenticate, validate({ body: predictSchema }), predictCategory);
router.post("/parse-sms", authenticate, validate({ body: parseSmsSchema }), parseSms);

export default router;
