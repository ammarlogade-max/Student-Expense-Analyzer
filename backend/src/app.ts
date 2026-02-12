import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth/auth.routes";
import expenseRoutes from "./routes/expense/expense.routes";
import healthRoutes from "./routes/health.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware";
import mlRoutes from "./routes/ml/ml.routes";
import { env } from "./config/env";

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

app.use(errorMiddleware);

export default app;
