import type { AdminUser, User } from "./types";

const TOKEN_KEY = "sea_token";
const REFRESH_KEY = "sea_refresh";
const USER_KEY = "sea_user";
const CSRF_KEY = "sea_csrf";
const ADMIN_TOKEN_KEY = "sea_admin_token";
const ADMIN_USER_KEY = "sea_admin_user";

function isCapacitorNative(): boolean {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
}

async function prefSet(key: string, value: string | null): Promise<void> {
  if (!isCapacitorNative()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    if (value === null) {
      await Preferences.remove({ key });
      return;
    }
    await Preferences.set({ key, value });
  } catch {
    return;
  }
}

async function prefGet(key: string): Promise<string | null> {
  if (!isCapacitorNative()) return null;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  void prefSet(TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
  void prefSet(REFRESH_KEY, token);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    const raw = JSON.stringify(user);
    localStorage.setItem(USER_KEY, raw);
    void prefSet(USER_KEY, raw);
  } else {
    localStorage.removeItem(USER_KEY);
    void prefSet(USER_KEY, null);
  }
}

export function getCsrfToken() {
  return localStorage.getItem(CSRF_KEY);
}

export function setCsrfToken(token: string | null) {
  if (token) {
    localStorage.setItem(CSRF_KEY, token);
  } else {
    localStorage.removeItem(CSRF_KEY);
  }
  void prefSet(CSRF_KEY, token);
}

export async function restoreFromPreferences(): Promise<void> {
  if (!isCapacitorNative()) return;

  const [token, refresh, user, csrf] = await Promise.all([
    prefGet(TOKEN_KEY),
    prefGet(REFRESH_KEY),
    prefGet(USER_KEY),
    prefGet(CSRF_KEY)
  ]);

  if (token && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (refresh && !localStorage.getItem(REFRESH_KEY)) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
  if (user && !localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, user);
  }
  if (csrf && !localStorage.getItem(CSRF_KEY)) {
    localStorage.setItem(CSRF_KEY, csrf);
  }
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function getStoredAdmin(): AdminUser | null {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setStoredAdmin(admin: AdminUser | null) {
  if (admin) {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(ADMIN_USER_KEY);
  }
}
