import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth/auth.routes";
import expenseRoutes from "./routes/expense/expense.routes";
import healthRoutes from "./routes/health.route";
import budgetRoutes from "./routes/budget/budget.routes";   // ← NEW
import { errorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware";
import mlRoutes from "./routes/ml/ml.routes";
import { env } from "./config/env";
import cashRoutes from "./routes/cash/cash.routes";
import scoreRoutes from "./routes/score/score.routes";

const app = express();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim()
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);

app.use("/api", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/budget", budgetRoutes);   // ← NEW
app.use("/api/score", scoreRoutes);

app.use(errorMiddleware);

export default app;
