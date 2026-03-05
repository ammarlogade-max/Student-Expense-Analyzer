import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { getCsrfToken, getToken } from "../lib/storage";

export interface SmsParseResult {
  amount: number | null;
  merchant: string | null;
  category: string | null;
  confidence: number;
  date: string | null;
  rawSms: string;
  saved: boolean;
}

interface SmsMessage {
  address: string;
  body: string;
  date: number;
}

const BANK_SENDERS = /^(HDFCBK|SBIINB|ICICIB|KOTAKB|AXISBK|SBICRD|PAYTMB|IDFCBK|YESBK|BOIIND|CANBNK|PNBSMS|UNIONB|INDBNK|VM-HDFCBK|VK-SBIINB|BP-ICICIB|AD-KOTAKB)/i;
const DEBIT_KEYWORDS = /\b(debited|debit|spent|paid|payment|purchase|withdrawn|transferred|txn|transaction)\b/i;

function isBankDebitSms(address: string, body: string): boolean {
  return BANK_SENDERS.test(address) && DEBIT_KEYWORDS.test(body);
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function isNativePlatform(): boolean {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
}

async function parseSmsOnBackend(smsText: string): Promise<SmsParseResult | null> {
  const token = getToken();
  const csrf = getCsrfToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/sms/auto-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(csrf ? { "x-csrf-token": csrf } : {}),
      },
      body: JSON.stringify({ smsText }),
    });

    if (!res.ok) return null;
    return (await res.json()) as SmsParseResult;
  } catch {
    return null;
  }
}

async function fireConfirmNotification(result: SmsParseResult) {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: `Rs ${result.amount ?? 0} from ${result.merchant ?? "unknown"}`,
          body: "Select category",
          schedule: { at: new Date(Date.now() + 500) },
          actionTypeId: "SMS_CONFIRM",
          extra: {
            amount: result.amount,
            merchant: result.merchant,
            rawSms: result.rawSms,
          },
        },
      ],
    });
  } catch {
    // no-op on web
  }
}

async function registerNotificationActions() {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: "SMS_CONFIRM",
          actions: [
            { id: "food", title: "Food" },
            { id: "transport", title: "Transport" },
            { id: "shopping", title: "Shopping" },
            { id: "entertainment", title: "Entertainment" },
            { id: "education", title: "Education" },
            { id: "health", title: "Health" },
            { id: "other", title: "Other" },
          ],
        },
      ],
    });
  } catch {
    // no-op on web
  }
}

export function useSmsPermission() {
  const { push } = useToast();
  const [hasPermission, setHasPermission] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [isCapacitor, setIsCapacitor] = useState(false);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    setIsCapacitor(isNativePlatform());
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform()) {
      push("SMS auto-parse requires Android app", "info");
      return false;
    }

    try {
      const { SmsPlugin } = await import("../plugins/SmsPlugin");
      const pluginAny = SmsPlugin as any;
      if (typeof pluginAny.requestPermissions === "function") {
        const permissionResult = await pluginAny.requestPermissions();
        const readGranted = permissionResult?.readSms === "granted" || permissionResult?.receiveSms === "granted";
        setHasPermission(Boolean(readGranted));
      } else {
        setHasPermission(true);
      }

      await registerNotificationActions();
      push("SMS permission enabled", "success");
      return true;
    } catch (err) {
      console.error("[SMS] Permission request failed:", err);
      push("Failed to enable SMS permission", "error");
      return false;
    }
  }, [push]);

  const importInboxHistory = useCallback(async () => {
    if (!isCapacitor || !hasPermission) return;

    setIsImporting(true);
    try {
      const { SmsPlugin } = await import("../plugins/SmsPlugin");
      const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const { messages } = await SmsPlugin.getMessages({ since });

      const bankMessages: SmsMessage[] = messages.filter((msg: SmsMessage) => isBankDebitSms(msg.address, msg.body));
      setImportProgress({ done: 0, total: bankMessages.length });

      if (bankMessages.length === 0) {
        push("No bank SMS found in last 90 days", "info");
        return;
      }

      const BATCH = 10;
      let done = 0;

      for (let i = 0; i < bankMessages.length; i += BATCH) {
        const batch = bankMessages.slice(i, i + BATCH);
        await Promise.all(batch.map((msg) => parseSmsOnBackend(msg.body)));
        done += batch.length;
        setImportProgress({ done, total: bankMessages.length });
      }

      push(`Imported ${done} expenses from SMS history`, "success");
    } catch (err) {
      console.error("[SMS] Inbox import failed:", err);
      push("Failed to read SMS inbox", "error");
    } finally {
      setIsImporting(false);
    }
  }, [hasPermission, isCapacitor, push]);

  useEffect(() => {
    if (!isCapacitor || !hasPermission) return;

    let active = true;

    const start = async () => {
      try {
        const { SmsPlugin } = await import("../plugins/SmsPlugin");

        listenerRef.current = await SmsPlugin.addListener("smsReceived", async (msg: SmsMessage) => {
          if (!active) return;
          if (!isBankDebitSms(msg.address, msg.body)) return;

          const result = await parseSmsOnBackend(msg.body);
          if (!result) return;

          if (result.saved) {
            push(`Auto-logged Rs ${result.amount ?? 0} - ${result.category ?? "Other"}`, "success");
          } else {
            await fireConfirmNotification(result);
          }
        });
      } catch (err) {
        console.error("[SMS] Listener failed:", err);
      }
    };

    start();

    return () => {
      active = false;
      listenerRef.current?.remove();
      listenerRef.current = null;
    };
  }, [hasPermission, isCapacitor, push]);

  return {
    isCapacitor,
    hasPermission,
    isImporting,
    importProgress,
    requestPermissions,
    importInboxHistory,
  };
}
