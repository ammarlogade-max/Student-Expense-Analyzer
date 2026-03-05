/**
 * SmsPlugin.ts — Capacitor bridge to native Android SMS
 *
 * This is the JavaScript side of the custom Capacitor plugin.
 * The native (Java) side lives in android/app/src/main/java/.../SmsPlugin.java
 *
 * Methods:
 *   getMessages({ since })  → reads SMS inbox since timestamp
 *   addListener("smsReceived", callback) → listens for new incoming SMS
 */

import { registerPlugin } from "@capacitor/core";

export interface SmsMessage {
  address: string;  // sender ID e.g. "HDFCBK"
  body:    string;  // full SMS text
  date:    number;  // unix timestamp ms
}

export interface SmsPlugin {
  getMessages(options: { since: number }): Promise<{ messages: SmsMessage[] }>;
  addListener(
    event: "smsReceived",
    callback: (msg: SmsMessage) => void
  ): Promise<{ remove: () => void }>;
}

// Registers the plugin — Capacitor will find the native implementation
// when running on Android. On web, calls return empty/noop gracefully.
export const SmsPlugin = registerPlugin<SmsPlugin>("SmsPlugin", {
  web: {
    // Web fallback — SMS reading not possible on web
    getMessages: async () => ({ messages: [] }),
    addListener:  async () => ({ remove: () => {} }),
  },
});
