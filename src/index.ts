// instrument.ts MUST be the first import so Sentry is initialized
// before app.ts and all other modules are loaded.
import "./instrument";

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
