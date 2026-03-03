import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { calculateScore, saveScore } from "../services/score/score.engine";

const prisma = new PrismaClient();

/**
 * Runs every night at 23:45 IST (18:15 UTC)
 * Calculates and saves scores for ALL users who logged at least one expense
 * this month. This means Dashboard always shows fresh data on next load.
 *
 * Add to your app.ts:
 *   import "./jobs/score.scheduler";
 */
export function startScoreScheduler() {
  // 23:45 IST = 18:15 UTC
  cron.schedule("15 18 * * *", async () => {
    console.log("[ScoreScheduler] Starting nightly score calculation...");
    const start = Date.now();

    try {
      // Get all users who have logged at least one expense
      const users = await prisma.user.findMany({
        where: { expenses: { some: {} } },
        select: { id: true },
      });

      let success = 0;
      let failed  = 0;

      // Process in batches of 10 to avoid DB overload
      const BATCH = 10;
      for (let i = 0; i < users.length; i += BATCH) {
        const batch = users.slice(i, i + BATCH);
        await Promise.allSettled(
          batch.map(async ({ id }) => {
            try {
              const breakdown = await calculateScore(id);
              await saveScore(id, breakdown);
              success++;
            } catch (err) {
              console.error(`[ScoreScheduler] Failed for user ${id}:`, err);
              failed++;
            }
          })
        );
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `[ScoreScheduler] Done in ${elapsed}s — ${success} success, ${failed} failed`
      );
    } catch (err) {
      console.error("[ScoreScheduler] Fatal error:", err);
    }
  });

  console.log("[ScoreScheduler] Registered — runs nightly at 23:45 IST");
}
