import axios from "axios";
import type {
  AdminActivityResponse,
  AdminMlResponse,
  AdminOverview,
  AdminSystemResponse,
  AdminUser,
  AdminUsersResponse
} from "./types";
import { getAdminToken } from "./storage";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

const adminClient = axios.create({
  baseURL: API_BASE
});

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export async function adminLogin(email: string, password: string) {
  try {
    const { data } = await adminClient.post<{
      success: boolean;
      token: string;
      admin: AdminUser;
    }>("/admin/login", { email, password });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Admin login failed"));
  }
}

export async function getAdminOverview() {
  try {
    const { data } = await adminClient.get<{
      success: boolean;
      overview: AdminOverview;
    }>("/admin/overview");
    return data.overview;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load admin overview"));
  }
}

export async function getAdminUsers(page = 1, limit = 20) {
  try {
    const { data } = await adminClient.get<AdminUsersResponse>("/admin/users", {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load admin users"));
  }
}

export async function getAdminActivity(page = 1, limit = 25) {
  try {
    const { data } = await adminClient.get<AdminActivityResponse>("/admin/activity", {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load admin activity"));
  }
}

export async function getAdminMl(page = 1, limit = 25) {
  try {
    const { data } = await adminClient.get<AdminMlResponse>("/admin/ml", {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load ML insights"));
  }
}

export async function getAdminSystem() {
  try {
    const { data } = await adminClient.get<AdminSystemResponse>("/admin/system");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load system health"));
  }
}
