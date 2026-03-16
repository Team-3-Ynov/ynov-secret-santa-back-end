<!-- known-pitfalls.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [Sentry Init Order](#sentry-init-order) - instrument.ts, import hoisting, TypeScript
- [Sentry Double Reporting](#sentry-double-reporting) - captureException, setupExpressErrorHandler
- [Deprecated Sentry Tracing](#deprecated-sentry-tracing) - @sentry/tracing
- [Oxlint Scope](#oxlint-scope) - typecheck, oxlint, tsc, jest vs vitest

## Activation Matrix

- Context: Sentry Init Order
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `03-security.md`, `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/orchestrator.md`

- Context: Sentry Double Reporting
- Roles: `backend-engineer.md`
- Tier 1 Skills: `05-api-standards.md`, `03-security.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/rules/tier-0/11-agent-behavior.md`

- Context: Deprecated Sentry Tracing
- Roles: `backend-engineer.md`
- Tier 1 Skills: `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

- Context: Oxlint Scope
- Roles: `backend-engineer.md`
- Tier 1 Skills: `06-testing.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

## <section id="sentry-init-order"> Sentry Init Order

**Pitfall:** Placing `Sentry.init()` inline in `src/index.ts` after existing `import` statements does NOT guarantee it runs first.

**Root cause:** TypeScript compiles ES module `import` statements to CommonJS `require()` calls. All `require()` calls are hoisted before the module body, so `app.ts` (and all its transitive dependencies) is fully loaded before the first line of `index.ts` executes. This means `Sentry.setupExpressErrorHandler(app)` runs on an uninitialized SDK.

**Fix:** Extract `Sentry.init()` into `src/instrument.ts` and make it the **first** import in `src/index.ts`:
```ts
// src/index.ts — FIRST LINE
import "./instrument";
// everything else after
import app from "./app";
```

</section>

## <section id="sentry-double-reporting"> Sentry Double Reporting

**Pitfall:** Calling `Sentry.captureException(err)` manually in the global Express error handler when `Sentry.setupExpressErrorHandler(app)` is already registered.

**Root cause:** `setupExpressErrorHandler` registers its own error-handler middleware that captures every error passed to `next(err)` and forwards it to Sentry, then calls `next(err)` itself. Adding a second `captureException` in the following error handler sends each error twice.

**Fix:** Remove manual `captureException` calls from the global error handler. `setupExpressErrorHandler` handles it. Place any custom error handler **after** `setupExpressErrorHandler`.

</section>

## <section id="deprecated-sentry-tracing"> Deprecated Sentry Tracing

**Pitfall:** Adding `@sentry/tracing` as a dependency.

**Root cause:** `@sentry/tracing` was a standalone package for Sentry v7. Since `@sentry/node` v8, tracing is fully built in. The package is deprecated and conflicts with `@sentry/node` v10.

**Fix:** Do NOT install `@sentry/tracing`. Use only `@sentry/node` (v10+). All integrations (`httpIntegration`, `expressIntegration`, etc.) are importable directly from `@sentry/node`.

</section>

## <section id="oxlint-scope"> Oxlint Scope

**Pitfall:** Expecting `oxlint` to replace `tsc --noEmit` for type-safety.

**Root cause:** `oxlint` is a fast Rust-based linter (OXC project). It catches many code-quality and TypeScript-style issues in ~55ms, but it does NOT perform full type inference. Only `tsc --noEmit` can catch inference errors (wrong return type, unknown property access, etc.).

**Fix:** `pnpm typecheck` runs both in sequence: `oxlint` first as a fast fail gate, then `tsc --noEmit` for inference. Never skip either step.

**Pitfall (vitest vs jest):** The `.oxlintrc.json` enables the `vitest` plugin. If the `jest` plugin is active instead, it produces false positives on `vi.fn()`, `vi.mock()`, etc. Only ever enable one of the two.

</section>
