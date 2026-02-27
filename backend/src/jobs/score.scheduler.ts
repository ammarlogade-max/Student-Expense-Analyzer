import cron from "node-cron";
import prisma from "../config/prisma";
import { calculateScore, saveScore } from "../services/score/score.engine";

export function startScoreScheduler() {
  cron.schedule("15 18 * * *", async () => {
    console.log("[ScoreScheduler] Starting nightly score calculation...");
    const start = Date.now();

    try {
      const users = await prisma.user.findMany({
        where: { expenses: { some: {} } },
        select: { id: true }
      });

      let success = 0;
      let failed = 0;

      const BATCH = 10;
      for (let i = 0; i < users.length; i += BATCH) {
        const batch = users.slice(i, i + BATCH);
        await Promise.allSettled(
          batch.map(async ({ id }) => {
            try {
              const breakdown = await calculateScore(id);
              await saveScore(id, breakdown);
              success += 1;
            } catch (err) {
              console.error(`[ScoreScheduler] Failed for user ${id}:`, err);
              failed += 1;
            }
          })
        );
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[ScoreScheduler] Done in ${elapsed}s - ${success} success, ${failed} failed`);
    } catch (err) {
      console.error("[ScoreScheduler] Fatal error:", err);
    }
  });

  console.log("[ScoreScheduler] Registered - runs nightly at 23:45 IST");
}
