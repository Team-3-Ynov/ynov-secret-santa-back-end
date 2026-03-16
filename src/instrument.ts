/**
 * Sentry initialization — MUST be imported before any other modules.
 *
 * TypeScript compiles `import` statements to `require()` calls that are hoisted
 * before the module body, so placing Sentry.init() inline in index.ts means it
 * runs *after* app.ts is already loaded. This file is required first in index.ts
 * to guarantee correct initialization order.
 */
import "dotenv/config";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Only activate when a DSN is actually configured
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  // Allow overriding via env var (e.g. set lower in production for high-traffic)
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "1.0"),
  // Tag each event with the deployed release version
  release: process.env.SENTRY_RELEASE ?? process.env.npm_package_version,
  debug: false,
});
