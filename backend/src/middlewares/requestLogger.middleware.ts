import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { recordRequestMetric } from "../services/system/system.service";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`);
    recordRequestMetric({
      method,
      path: originalUrl,
      statusCode: res.statusCode,
      durationMs: duration
    });
  });

  next();
}
