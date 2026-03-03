import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import {
  completeOnboarding,
  getOnboardingStatus,
  updateProfile
} from "../../controllers/onboarding/onboarding.controller";

const router = Router();

router.use(authenticate);

router.get("/status", getOnboardingStatus);
router.post("/complete", requireCsrf, completeOnboarding);
router.patch("/profile", requireCsrf, updateProfile);

export default router;
