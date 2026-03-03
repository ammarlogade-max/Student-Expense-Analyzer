import { Router } from "express";
import {
  registerFcmToken,
  removeFcmToken,
  getNotificationHistory,
  handleNotificationAction,
  testEveningReminder,
} from "../../controllers/notifications/notification.controller";
import { authenticate } from "../../middlewares/auth/auth.middleware";
import { requireCsrf } from "../../middlewares/csrf.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCsrf);

// Token management
router.post("/token", registerFcmToken);
router.delete("/token", removeFcmToken);

// Notification history
router.get("/history", getNotificationHistory);

// Notification action (voice/text entry from notification buttons)
router.post("/action", handleNotificationAction);

// Dev testing
router.post("/test/evening", testEveningReminder);

export default router;
