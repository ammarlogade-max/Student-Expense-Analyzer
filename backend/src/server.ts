import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startCashReconciliationScheduler } from "./services/cash/cash.scheduler";
import { startScoreScheduler } from "./jobs/score.scheduler";

const PORT = Number(env.PORT);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info("Expected frontend API target pattern: ${VITE_API_URL}/api/*");
  startCashReconciliationScheduler();
  startScoreScheduler();
});
