import { useEffect } from "react";
import { getCsrfToken, getToken } from "../lib/storage";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
const NATIVE_FCM_TOKEN_KEY = "expenseiq_native_fcm_token";

function isNativePlatform(): boolean {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
}

async function registerTokenWithBackend(token: string): Promise<boolean> {
  const jwt = getToken();
  if (!jwt) return false;
  const csrf = getCsrfToken();

  const response = await fetch(`${API_BASE}/notifications/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    body: JSON.stringify({ token, platform: "android" }),
  });

  return response.ok;
}

async function confirmSmsCategory(amount: number, merchant: string, category: string) {
  const jwt = getToken();
  if (!jwt) return;
  const csrf = getCsrfToken();

  await fetch(`${API_BASE}/sms/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    body: JSON.stringify({ amount, merchant, category }),
  });
}

export function useCapacitorNotifications() {
  const { push } = useToast();
  const { token: authToken } = useAuth();

  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanupFns: Array<() => void> = [];

    const setup = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") return;

        await PushNotifications.register();

        const tokenListener = await PushNotifications.addListener("registration", async ({ value }) => {
          localStorage.setItem(NATIVE_FCM_TOKEN_KEY, value);
          try {
            await registerTokenWithBackend(value);
          } catch (err) {
            console.error("[Push] Failed to register token:", err);
          }
        });
        cleanupFns.push(() => {
          tokenListener.remove();
        });

        const messageListener = await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          push(notification.title ?? "ExpenseIQ", "info");
        });
        cleanupFns.push(() => {
          messageListener.remove();
        });

        const tapListener = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data ?? {};
          if (typeof data.action_url === "string" && data.action_url) {
            window.location.href = data.action_url;
          }
        });
        cleanupFns.push(() => {
          tapListener.remove();
        });

        const localTapListener = await LocalNotifications.addListener("localNotificationActionPerformed", async (event) => {
          const extra = (event.notification.extra ?? {}) as { amount?: number; merchant?: string };
          const actionId = event.actionId;
          if (!actionId || actionId === "tap") return;

          const CATEGORY_MAP: Record<string, string> = {
            food: "Food",
            transport: "Transport",
            shopping: "Shopping",
            entertainment: "Entertainment",
            education: "Education",
            health: "Health",
            other: "Other",
          };

          const category = CATEGORY_MAP[actionId] ?? "Other";
          const amount = Number(extra.amount ?? 0);
          const merchant = String(extra.merchant ?? "SMS import");
          if (amount <= 0) return;

          try {
            await confirmSmsCategory(amount, merchant, category);
            push(`Logged as ${category}`, "success");
          } catch {
            push("Failed to save expense", "error");
          }
        });
        cleanupFns.push(() => {
          localTapListener.remove();
        });
      } catch (err) {
        console.error("[Capacitor Notifications] Setup failed:", err);
      }
    };

    setup();

    return () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, [push]);

  useEffect(() => {
    if (!isNativePlatform()) return;
    if (!authToken) return;

    const pendingToken = localStorage.getItem(NATIVE_FCM_TOKEN_KEY);
    if (!pendingToken) return;

    registerTokenWithBackend(pendingToken).catch((err) => {
      console.error("[Push] Failed to sync token after login:", err);
    });
  }, [authToken]);
}
