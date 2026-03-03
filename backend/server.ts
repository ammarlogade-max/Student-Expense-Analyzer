/**
 * server.ts — Entry point
 *
 * Kept separate from app.ts so tests can import app without starting the server.
 * This is what Render runs: node dist/server.js
 */

import app from "./src/app";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] ExpenseIQ backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown — Render sends SIGTERM before killing the container
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT received — shutting down");
  process.exit(0);
});
