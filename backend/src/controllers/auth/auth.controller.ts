import { Request, Response } from "express";
import {
  loginUser,
  refreshTokens,
  revokeRefreshToken,
  signupUser
} from "../../services/auth/auth.service";
import { verify } from "jsonwebtoken";
import { env } from "../../config/env";

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const user = await signupUser({ name, email, password });

    return res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Signup failed"
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || "Login failed"
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const decoded = verify(refreshToken, env.REFRESH_SECRET) as {
      userId: string;
    };

    const tokens = await refreshTokens(decoded.userId, refreshToken);
    return res.status(200).json({
      message: "Token refreshed",
      token: tokens.token,
      refreshToken: tokens.refreshToken
    });
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || "Refresh failed"
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    await revokeRefreshToken(user.userId);
    return res.status(200).json({ message: "Logged out" });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Logout failed"
    });
  }
}
