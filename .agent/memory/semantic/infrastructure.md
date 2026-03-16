<!-- infrastructure.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [Runtime](#runtime) - node, express, scripts, typecheck
- [Database](#database) - postgres, migrations
- [Observability](#observability) - sentry, error tracking, user context
- [Email And Docs](#email-and-docs) - mailhog, swagger

## Activation Matrix

- Context: Runtime
- Roles: `backend-engineer.md`
- Tier 1 Skills: `06-testing.md`, `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/orchestrator.md`

- Context: Database
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `04-database.md`, `03-security.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

- Context: Observability
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `03-security.md`, `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

- Context: Email And Docs
- Roles: `backend-engineer.md`
- Tier 1 Skills: `05-api-standards.md`, `03-security.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/rules/tier-0/11-agent-behavior.md`

## <section id="runtime"> Runtime

- Node.js 20+ runtime.
- Main scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`.
- `pnpm typecheck` → runs `oxlint src tests scripts` (OXC, ~55ms) then `tsc --noEmit`. Plugins: `node`, `import`, `vitest`. Config: `.oxlintrc.json`.
- Docker compose profiles support infra-only and full stack setups.

</section>

## <section id="database"> Database

- PostgreSQL is required for local and production environments.
- SQL migrations are tracked under `database/migrations`.
- Migration command: `pnpm migrate`.

</section>

## <section id="observability"> Observability

- Sentry SDK: `@sentry/node` v10 (includes tracing — do NOT add `@sentry/tracing`, it is deprecated).
- **Init file:** `src/instrument.ts` — must be imported **before** any other module in `src/index.ts` (TypeScript import hoisting pitfall; see `known-pitfalls.md`).
- **Express integration:** `Sentry.setupExpressErrorHandler(app)` in `src/app.ts` before the global error handler. Do not call `captureException` again manually in the same handler — it causes double-reporting.
- **User context:** `src/middlewares/auth.middleware.ts` calls `Sentry.setUser({ id, email })` after JWT verification so every event from authenticated requests is tagged.
- **Env vars:**
  - `SENTRY_DSN` — required to activate (disabled when absent).
  - `SENTRY_RELEASE` — optional, auto-falls back to `npm_package_version`.
  - `SENTRY_TRACES_SAMPLE_RATE` — optional, default 1.0.

</section>

## <section id="email-and-docs"> Email And Docs

- SMTP development flow targets MailHog (`1025` SMTP, `8025` UI).
- OpenAPI docs are served at `/api-docs` and based on `src/docs/openapi.yaml`.

</section>
