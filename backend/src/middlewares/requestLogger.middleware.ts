import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
}
