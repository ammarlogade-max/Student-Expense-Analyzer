import type { Response } from "express";
import type { UserRequest } from "../../types/auth";
import { AppError } from "../../utils/AppError";
import { recordUserActivity } from "../../services/activity/activity.service";

export async function trackFeatureUsage(req: UserRequest, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const { feature, description, metadata } = req.body;

  await recordUserActivity({
    userId: req.user.userId,
    action: "FEATURE_USAGE",
    feature,
    description,
    metadata,
    req
  });

  return res.status(201).json({
    success: true
  });
}
