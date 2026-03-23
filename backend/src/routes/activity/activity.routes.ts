import { Router } from "express";
import { trackFeatureUsage } from "../../controllers/activity/activity.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { featureUsageSchema } from "../../validators/activity.validator";

const router = Router();

router.post("/feature", authenticate, validate({ body: featureUsageSchema }), trackFeatureUsage);

export default router;
