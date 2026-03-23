import type { Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import type { UserRequest } from "../../types/auth";

export const authenticate = (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId as string,
      email: decoded.email as string
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
