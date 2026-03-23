import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth/auth.routes";
import expenseRoutes from "./routes/expense/expense.routes";
import healthRoutes from "./routes/health.route";
import budgetRoutes from "./routes/budget/budget.routes";
import mlRoutes from "./routes/ml/ml.routes";
import cashRoutes from "./routes/cash/cash.routes";
import scoreRoutes from "./routes/score/score.routes";
import onboardingRoutes from "./routes/onboarding/onboarding.routes";
import notificationRoutes from "./routes/notifications/notification.routes";
import smsAutoRoutes from "./routes/sms/sms.auto.routes";
import adminRoutes from "./routes/admin/admin.routes";
import activityRoutes from "./routes/activity/activity.routes";
import { startNotificationScheduler } from "./jobs/notification.scheduler";
import { errorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet());
const configuredOrigins = env.CORS_ORIGIN
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const vercelPreviewRegex = /^https:\/\/student-expense-analyzer.*\.vercel\.app$/;
const nativeAppOrigins = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost"
]);
const allowedOrigins = new Set([...configuredOrigins, ...nativeAppOrigins]);

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
  return false;
}

logger.info(`CORS configured origins: ${configuredOrigins.join(", ") || "(none)"}`);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      logger.info(`CORS blocked origin: ${origin ?? "unknown"}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);
startNotificationScheduler();

app.use("/api", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", authLimiter, adminRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sms", smsAutoRoutes);
app.use("/api/activity", activityRoutes);

app.use(errorMiddleware);

export default app;
