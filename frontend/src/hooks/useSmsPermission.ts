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

const BANK_SENDER_CODES = [
  "HDFCBK",
  "HDFC",
  "SBIINB",
  "SBICRD",
  "SBI",
  "ICICIB",
  "ICICI",
  "KOTAKB",
  "KOTAK",
  "AXISBK",
  "AXIS",
  "IDFCBK",
  "IDFC",
  "YESBK",
  "BOIIND",
  "CANBNK",
  "PNBSMS",
  "UNIONB",
  "INDBNK",
  "PAYTMB",
  "AUSFBL",
  "IDBIBK",
  "BOBSMS",
  "INDUSB",
  "RBLBNK",
  "FEDBK",
  "DBS",
  "SCBANK",
  "HSBC",
  "CITIBK",
];

const BANK_BODY_HINTS =
  /\b(a\/c|account|acct|upi|neft|imps|rtgs|debit\s*card|credit\s*card|avl|available|balance|merchant|terminal|inr|rs\.?|₹)\b/i;
const DEBIT_KEYWORDS =
  /\b(debited|debit|spent|paid|payment|purchase|withdrawn|withdrawal|transferred|sent|txn|transaction|dr\.?|charged|used)\b/i;
const CREDIT_ONLY_KEYWORDS =
  /\b(credited|credit|salary|refund|cashback|reversal|reward|interest)\b/i;
const OTP_KEYWORDS = /\b(otp|one[-\s]?time password|do not share|never share)\b/i;
const AMOUNT_PATTERN = /(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d{1,2})?/i;

function normalizeSender(address: string): string {
  return (address || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isBankDebitSms(address: string, body: string): boolean {
  const sender = normalizeSender(address);
  if (!body || OTP_KEYWORDS.test(body)) return false;

  const hasKnownSender = BANK_SENDER_CODES.some((code) => sender.includes(code));
  const hasAmount = AMOUNT_PATTERN.test(body);
  if (!hasAmount) return false;

  const hasDebitKeyword = DEBIT_KEYWORDS.test(body);
  const hasCreditOnly = CREDIT_ONLY_KEYWORDS.test(body) && !hasDebitKeyword;
  const looksLikeBankBody = BANK_BODY_HINTS.test(body);

  if (hasCreditOnly) return false;
  if (!hasDebitKeyword) return false;

  return hasKnownSender || looksLikeBankBody;
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
  const [debugSummary, setDebugSummary] = useState<string | null>(null);
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
        await pluginAny.requestPermissions();
      }

      await SmsPlugin.getMessages({ since: Date.now() - 60 * 1000 });
      setHasPermission(true);
      await registerNotificationActions();
      push("SMS permission enabled", "success");
      return true;
    } catch (err) {
      console.error("[SMS] Permission request failed:", err);
      setHasPermission(false);
      push("SMS permission denied or unavailable", "error");
      return false;
    }
  }, [push]);

  const importInboxHistory = useCallback(async () => {
    if (!isCapacitor || !hasPermission) return;

    setIsImporting(true);
    setDebugSummary(null);
    try {
      const { SmsPlugin } = await import("../plugins/SmsPlugin");
      const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const { messages } = await SmsPlugin.getMessages({ since });
      const uniqueSenders = [...new Set(messages.map((msg: SmsMessage) => normalizeSender(msg.address)).filter(Boolean))];
      const sampleSenders = uniqueSenders.slice(0, 5).join(", ") || "none";
      setDebugSummary(
        `Scanned ${messages.length} SMS in last 90 days (${uniqueSenders.length} unique senders). Sample: ${sampleSenders}`
      );

      const bankMessages: SmsMessage[] = messages.filter((msg: SmsMessage) => isBankDebitSms(msg.address, msg.body));
      setImportProgress({ done: 0, total: bankMessages.length });

      if (bankMessages.length === 0) {
        console.info("[SMS Import] No matches. Sample senders:", uniqueSenders.slice(0, 12));
        push(
          `No bank debit SMS found in last 90 days (scanned ${messages.length} messages, ${uniqueSenders.length} senders)`,
          "info"
        );
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
    debugSummary,
    requestPermissions,
    importInboxHistory,
  };
}
