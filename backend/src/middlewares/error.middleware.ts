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

  const message = err?.message || "unknown";
  const stack = err?.stack ? `\n${err.stack}` : "";
  logger.error(
    `Unhandled Error [${req.method} ${req.originalUrl}] ${message}${stack}`
  );
  recordUnhandledError();

  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
}
