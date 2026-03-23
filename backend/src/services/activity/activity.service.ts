import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import prisma from "../../config/prisma";

export type ActivityAction =
  | "USER_LOGIN"
  | "EXPENSE_CREATED"
  | "SMS_IMPORT"
  | "FEATURE_USAGE"
  | "ADMIN_LOGIN";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
};

type UserActivityInput = {
  userId: string;
  action: ActivityAction;
  feature?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
};

type AdminActivityInput = {
  adminId: string;
  action: "ADMIN_LOGIN";
  description?: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
};

function detectDeviceType(userAgent?: string) {
  const normalized = userAgent?.toLowerCase() ?? "";

  if (!normalized) return "unknown";
  if (/ipad|tablet/.test(normalized)) return "tablet";
  if (/mobile|iphone|android/.test(normalized)) return "mobile";
  return "desktop";
}

function getRequestContext(req?: Request): RequestContext {
  if (!req) return {};

  const forwardedFor = req.headers["x-forwarded-for"];
  const ipAddress =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : req.ip;
  const userAgent = req.get("user-agent") ?? undefined;

  return {
    ipAddress,
    userAgent,
    deviceType: detectDeviceType(userAgent)
  };
}

export async function recordUserActivity({
  userId,
  action,
  feature,
  description,
  metadata,
  req
}: UserActivityInput) {
  const context = getRequestContext(req);
  const now = new Date();

  const [activity] = await prisma.$transaction([
    prisma.activityLog.create({
      data: {
        actorType: "USER",
        action,
        feature,
        description,
        metadata,
        userId,
        ...context
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: now,
        totalActions: {
          increment: 1
        },
        deviceType: context.deviceType ?? undefined
      }
    })
  ]);

  return activity;
}

export async function recordAdminActivity({
  adminId,
  action,
  description,
  metadata,
  req
}: AdminActivityInput) {
  const context = getRequestContext(req);

  return prisma.activityLog.create({
    data: {
      actorType: "ADMIN",
      action,
      description,
      metadata,
      adminId,
      ...context
    }
  });
}
