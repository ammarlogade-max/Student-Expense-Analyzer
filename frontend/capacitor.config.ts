import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId:     "com.expenseiq.app",
  appName:   "ExpenseIQ",
  webDir:    "dist",             // Vite build output
  server: {
    // In production the app loads from the bundled dist/ — no server URL needed.
    // Uncomment below ONLY for local dev with live reload:
    // url: "http://192.168.1.X:5173",
    // cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    // ── Push Notifications ────────────────────────────────────────────────
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // ── Local Notifications (for SMS-triggered alerts) ────────────────────
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor:  "#6366f1",
      sound:      "beep.wav",
    },
    // ── Status Bar ────────────────────────────────────────────────────────
    StatusBar: {
      style:           "Dark",
      backgroundColor: "#0f1115",
    },
    // ── Splash Screen ─────────────────────────────────────────────────────
    SplashScreen: {
      launchShowDuration:  2000,
      backgroundColor:     "#0f1115",
      androidSplashResourceName: "splash",
      showSpinner:         false,
    },
  },
};

export default config;
