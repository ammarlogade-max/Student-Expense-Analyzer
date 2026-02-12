import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const PORT = Number(env.PORT);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
