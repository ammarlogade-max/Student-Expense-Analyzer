import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      "Service-Worker-Allowed": "/",
    },
  },
  build: {
    // Ensure service worker file is not hashed (FCM requires exact filename)
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
});
