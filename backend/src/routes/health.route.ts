import { Router } from "express";
import prisma from "../config/prisma";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      database: "Connected",
      message: "Backend & DB healthy 🚀"
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected"
    });
  }
});

export default router;
