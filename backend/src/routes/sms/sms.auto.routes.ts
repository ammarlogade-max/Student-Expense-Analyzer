import { Router } from "express";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";
import { autoIngestSms, confirmSmsCategory } from "../../controllers/sms/sms.auto.controller";

const router = Router();

router.use(authenticate);

router.post("/auto-ingest", requireCsrf, autoIngestSms);
router.post("/confirm", requireCsrf, confirmSmsCategory);

export default router;
