import { randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const csrfStore = new Map<string, string>();

function newToken() {
  return randomBytes(32).toString("hex");
}

export function issueCsrfToken(userId: string) {
  const token = newToken();
  csrfStore.set(userId, token);
  return token;
}

export function getOrIssueCsrfToken(userId: string) {
  const existing = csrfStore.get(userId);
  if (existing) return existing;
  return issueCsrfToken(userId);
}

export function clearCsrfToken(userId: string) {
  csrfStore.delete(userId);
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const userId = (req as any).user?.userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const expected = csrfStore.get(userId);
  const provided = req.header("x-csrf-token");

  if (!expected || !provided || provided !== expected) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  return next();
}
