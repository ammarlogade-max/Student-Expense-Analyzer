/**
 * health.route.ts — Health check endpoint
 *
 * GET /api/health
 * Used by Render, Docker healthcheck, and load balancers.
 * Must return 200 within 10s or the container is marked unhealthy.
 *
 * REPLACE your existing src/routes/health.route.ts with this file.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router  = Router();
const prisma  = new PrismaClient();
const started = new Date();

router.get("/health", async (_req, res) => {
  const uptime = Math.floor((Date.now() - started.getTime()) / 1000);

  // Quick DB ping — fails fast if DB is unreachable
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "ok" ? 200 : 503;

  return res.status(status).json({
    status:      dbStatus === "ok" ? "ok" : "degraded",
    version:     "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    uptime:      `${uptime}s`,
    db:          dbStatus,
    timestamp:   new Date().toISOString(),
  });
});

export default router;
