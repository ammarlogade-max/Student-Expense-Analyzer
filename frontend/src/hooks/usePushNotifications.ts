/**
 * usePushNotifications hook
 *
 * Handles the full push notification lifecycle:
 *   1. Requests permission from the user (shows browser prompt)
 *   2. Gets the FCM token
 *   3. Registers it with the ExpenseIQ backend
 *   4. Listens for foreground messages → shows toast instead of system notif
 *   5. Cleans up token on logout
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { requestFcmToken, onForegroundMessage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getCsrfToken, getToken } from "../lib/storage";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function apiRegisterToken(token: string, authToken: string, csrfToken?: string | null) {
  return fetch(`${API_BASE}/notifications/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    },
    body: JSON.stringify({ token, platform: "web" }),
  });
}

async function apiRemoveToken(token: string, authToken: string, csrfToken?: string | null) {
  return fetch(`${API_BASE}/notifications/token`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    },
    body: JSON.stringify({ token }),
  });
}

export type PermissionState = "unknown" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const { user } = useAuth();
  const { push } = useToast();
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const OPT_OUT_KEY = "expenseiq_push_opt_out";

  useEffect(() => {
    authTokenRef.current = getToken();
  });

  const registerWithBackend = useCallback(async (token: string) => {
    const authToken = authTokenRef.current;
    if (!authToken) return;
    const csrfToken = getCsrfToken();
    try {
      await apiRegisterToken(token, authToken, csrfToken);
      setFcmToken(token);
      localStorage.setItem("expenseiq_fcm_token", token);
    } catch (err) {
      console.warn("[Push] Failed to register token:", err);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    localStorage.removeItem(OPT_OUT_KEY);
    if (!("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }
    const token = await requestFcmToken();
    if (!token) {
      setPermissionState(Notification.permission === "denied" ? "denied" : "unknown");
      return;
    }
    setPermissionState("granted");
    await registerWithBackend(token);
  }, [registerWithBackend]);

  // Auto-request if previously granted
  useEffect(() => {
    if (!user) return;
    const optedOut = localStorage.getItem(OPT_OUT_KEY) === "1";
    if (optedOut) {
      setFcmToken(null);
      setPermissionState(typeof Notification !== "undefined" && Notification.permission === "granted" ? "granted" : "unknown");
      return;
    }
    const perm = typeof Notification !== "undefined" ? Notification.permission : "default";
    if (perm === "granted") {
      setPermissionState("granted");
      requestFcmToken().then((t) => { if (t) registerWithBackend(t); });
    } else if (perm === "denied") {
      setPermissionState("denied");
    }
  }, [user, registerWithBackend]);

  const disableNotifications = useCallback(async () => {
    localStorage.setItem(OPT_OUT_KEY, "1");
    const saved = localStorage.getItem("expenseiq_fcm_token");
    const authToken = authTokenRef.current;
    const csrfToken = getCsrfToken();
    if (saved && authToken) {
      try {
        await apiRemoveToken(saved, authToken, csrfToken);
      } catch (err) {
        console.warn("[Push] Failed to remove token:", err);
      }
    }
    localStorage.removeItem("expenseiq_fcm_token");
    setFcmToken(null);
  }, []);

  // Foreground message → toast
  useEffect(() => {
    if (!user) return;
    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? "ExpenseIQ";
      const body  = payload.notification?.body  ?? "";
      const type  = payload.data?.type ?? "";
      const sev = type.includes("exceeded") || type.includes("breach") ? "error"
                : type.includes("90") || type.includes("risk") ? "warning"
                : "success";
      push(`${title} — ${body}`, sev as any);
    });
    return unsub;
  }, [user, push]);

  // Cleanup on logout
  useEffect(() => {
    if (user) return;
    const saved = localStorage.getItem("expenseiq_fcm_token");
    const auth  = authTokenRef.current;
    const csrfToken = getCsrfToken();
    if (saved && auth) {
      apiRemoveToken(saved, auth, csrfToken).catch(console.warn);
      localStorage.removeItem("expenseiq_fcm_token");
      setFcmToken(null);
    }
  }, [user]);

  return {
    permissionState,
    fcmToken,
    requestPermission,
    disableNotifications,
    isEnabled: !!fcmToken,
    isGranted:      permissionState === "granted",
    isDenied:       permissionState === "denied",
    isUnsupported:  permissionState === "unsupported",
  };
}
