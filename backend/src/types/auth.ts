import type { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export interface AuthenticatedAdmin {
  adminId: string;
  email: string;
  role: "admin";
}

export interface UserRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AdminRequest extends Request {
  admin?: AuthenticatedAdmin;
}
