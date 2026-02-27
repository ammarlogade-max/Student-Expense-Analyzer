import { runWeeklyReconciliation } from "./cash.service";
import { logger } from "../../utils/logger";

let lastRunDate: string | null = null;

function shouldRunSundayReconciliation(now: Date) {
  const isSunday = now.getDay() === 0;
  if (!isSunday) return false;
  const dateKey = now.toISOString().slice(0, 10);
  return lastRunDate !== dateKey;
}

export function startCashReconciliationScheduler() {
  const execute = async () => {
    const now = new Date();
    if (!shouldRunSundayReconciliation(now)) {
      return;
    }

    try {
      const created = await runWeeklyReconciliation(200);
      lastRunDate = now.toISOString().slice(0, 10);
      logger.info(
        `Weekly cash reconciliation ran. Alerts created: ${created.length}`
      );
    } catch (error) {
      logger.error(`Weekly cash reconciliation failed: ${String(error)}`);
    }
  };

  setInterval(execute, 1000 * 60 * 60);
  execute().catch((error) => {
    logger.error(`Initial cash reconciliation execution failed: ${String(error)}`);
  });
}

