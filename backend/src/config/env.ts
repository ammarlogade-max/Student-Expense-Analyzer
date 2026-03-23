import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  REFRESH_SECRET: requireEnv("REFRESH_SECRET"),
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || "30d",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@expenseiq.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin@123456",
  ADMIN_NAME: process.env.ADMIN_NAME || "System Admin"
};
