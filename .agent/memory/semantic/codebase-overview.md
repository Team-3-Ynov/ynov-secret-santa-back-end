<!-- codebase-overview.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [App Entry](#app-entry) - express, bootstrap, middleware, sentry
- [Module Layout](#module-layout) - controllers, services, models
- [Cross Cutting](#cross-cutting) - auth, validation, observability, docs, tests, tooling

## Activation Matrix

- Context: App Entry
- Roles: `backend-engineer.md`
- Tier 1 Skills: `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/orchestrator.md`

- Context: Module Layout
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `05-api-standards.md`, `03-security.md`, `04-database.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/rules/tier-0/11-agent-behavior.md`

- Context: Cross Cutting
- Roles: `api-security-reviewer.md`
- Tier 1 Skills: `03-security.md`, `06-testing.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

## <section id="app-entry"> App Entry

- `src/instrument.ts` initializes Sentry — **MUST be the first import in `index.ts`** (see known-pitfalls.md).
- `src/index.ts` starts the HTTP server; imports `./instrument` as its very first line.
- `src/app.ts` wires middleware, route modules, `Sentry.setupExpressErrorHandler`, and the global error handler.
- Runtime config is centralized in `src/config`.

</section>

## <section id="module-layout"> Module Layout

- `src/routes` defines endpoint paths and HTTP methods.
- `src/controllers` converts HTTP requests into service calls.
- `src/services` hosts business rules for events, users, notifications and email.
- `src/models` performs PostgreSQL read/write operations.
- `src/schemas` and `src/middlewares/validation.middleware.ts` validate request inputs.

</section>

## <section id="cross-cutting"> Cross Cutting

- Authentication guard: `src/middlewares/auth.middleware.ts` — calls `Sentry.setUser()` after a valid JWT is verified so all errors from authenticated routes are tagged with `userId` and `email`.
- OpenAPI contract source is `src/docs/openapi.yaml`.
- Migrations are in `database/migrations` and executed via `scripts/migrate.ts`.
- Tests are grouped under `tests/` by module type.
- Typecheck (OXC fast gate + tsc): `pnpm typecheck` → runs `oxlint` then `tsc --noEmit`. Config: `.oxlintrc.json` (plugins: import, node, vitest).

</section>
