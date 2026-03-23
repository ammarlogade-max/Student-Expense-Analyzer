import type { NextFunction, Response } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import type { AdminRequest } from "../../types/auth";

export function authenticateAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verify(token, env.JWT_SECRET) as JwtPayload;

    if (decoded.role !== "admin" || !decoded.adminId || !decoded.email) {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    req.admin = {
      adminId: decoded.adminId as string,
      email: decoded.email as string,
      role: "admin"
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired admin token"
    });
  }
}
