import type { Response } from "express";
import { AppError } from "../../utils/AppError";
import type { AdminRequest } from "../../types/auth";
import {
  getAdminActivity,
  getAdminMl,
  getAdminOverview,
  getAdminSystem,
  getAdminUsers,
  loginAdmin
} from "../../services/admin/admin.service";
import { recordAdminActivity } from "../../services/activity/activity.service";

function getPagination(req: AdminRequest) {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  return { page, limit };
}

export async function adminLogin(req: AdminRequest, res: Response) {
  const { email, password } = req.body;
  const result = await loginAdmin(email, password);

  await recordAdminActivity({
    adminId: result.admin.id,
    action: "ADMIN_LOGIN",
    description: "Admin signed in",
    metadata: {
      source: "admin-dashboard"
    },
    req
  });

  return res.status(200).json({
    success: true,
    token: result.token,
    admin: result.admin
  });
}

export async function adminOverview(_req: AdminRequest, res: Response) {
  const overview = await getAdminOverview();
  return res.status(200).json({
    success: true,
    overview
  });
}

export async function adminUsers(req: AdminRequest, res: Response) {
  const result = await getAdminUsers(getPagination(req));
  return res.status(200).json({
    success: true,
    ...result
  });
}

export async function adminActivity(req: AdminRequest, res: Response) {
  const result = await getAdminActivity(getPagination(req));
  return res.status(200).json({
    success: true,
    ...result
  });
}

export async function adminMl(req: AdminRequest, res: Response) {
  const result = await getAdminMl(getPagination(req));
  return res.status(200).json({
    success: true,
    ...result
  });
}

export async function adminSystem(_req: AdminRequest, res: Response) {
  const result = await getAdminSystem();
  return res.status(200).json({
    success: true,
    system: result
  });
}

export function requireAdmin(req: AdminRequest) {
  if (!req.admin) {
    throw new AppError("Unauthorized", 401);
  }
  return req.admin;
}
