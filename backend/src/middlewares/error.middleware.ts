import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { recordUnhandledError } from "../services/system/system.service";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  logger.error(`Unhandled Error: ${err?.message || "unknown"}`);
  recordUnhandledError();

  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
}
