import net from "node:net";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startCashReconciliationScheduler } from "./services/cash/cash.scheduler";
import { startScoreScheduler } from "./jobs/score.scheduler";

const BASE_PORT = Number(env.PORT);
const MAX_PORT_ATTEMPTS = 20;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findPort(startPort: number): Promise<number> {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const candidate = startPort + offset;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `No free port found between ${startPort} and ${startPort + MAX_PORT_ATTEMPTS - 1}`
  );
}

async function startServer() {
  if (Number.isNaN(BASE_PORT) || BASE_PORT <= 0) {
    throw new Error(`Invalid PORT value: ${env.PORT}`);
  }

  const port =
    env.NODE_ENV === "development" ? await findPort(BASE_PORT) : BASE_PORT;

  app.listen(port, () => {
    if (port !== BASE_PORT) {
      logger.info(`Port ${BASE_PORT} is busy, server started on port ${port}`);
    }
    logger.info(`Server running on port ${port}`);
    startCashReconciliationScheduler();
    startScoreScheduler();
  });
}

void startServer();
