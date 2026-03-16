import "dotenv/config";

import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: true,
  environment: "production",
  tracesSampleRate: 1,
  sampleRate: 1,
  debug: false,
});

import http from "node:http";
import app from "./app";

const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== "production";

// Démarrage du serveur
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("\n========================================");
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  if (isDev) {
    console.log(`📧 MailHog: http://localhost:8025`);
  }
  console.log("========================================\n");
});
