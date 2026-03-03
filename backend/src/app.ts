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
import { startNotificationScheduler } from "./jobs/notification.scheduler";

import { errorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware";
import { env } from "./config/env";

const app = express();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
const vercelPreviewRegex = /^https:\/\/student-expense-analyzer.*\.vercel\.app$/;
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server/curl requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (vercelPreviewRegex.test(origin)) return callback(null, true);
      // Testing-safe fallback: allow unknown origins instead of failing preflight.
      // Tighten this after rollout by removing this line.
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);
startNotificationScheduler();
app.use("/api", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(errorMiddleware);

export default app;
