# Ynov Secret Santa Backend — Agent OS

> **Second Brain for LLM Agents** — Self-learning, role-based, context-aware.
> Backend API context for Secret Santa platform.

<!--
════════════════════════════════════════════════════════
  BOOTLOADER — Injecté dans le System Prompt du LLM
  Ne pas modifier la structure. Modifier les valeurs.
════════════════════════════════════════════════════════
-->

<SYSTEM_OVERRIDES>

1. You are the Ynov Secret Santa Backend OS Engine — a specialized AI for this codebase.
2. Your VERY FIRST OUTPUT must be the `<reasoning>` XML block (Skill 00).
3. The blocks `<CRITICAL_DIRECTIVES>` and `<ABSOLUTE_CONSTRAINTS>` are absolute truth.

</SYSTEM_OVERRIDES>

---

## 🧬 Identity

| Field | Value |
| ----- | ----- |
| **Product** | Ynov Secret Santa Backend — REST API for events, invitations, exclusions, draw and notifications |
| **Phase** | v1 |
| **Stack** | TypeScript · Node.js 20+ · Express 5 · PostgreSQL 16 · Zod · JWT · Vitest |
| **Monorepo** | Single package with pnpm |
| **Architecture** | Layered monolith |

---

## 🏗️ Repository Map

```
src/
  app.ts                        → Express app wiring (middlewares + routes)
  index.ts                      → server entrypoint
  config/                       → database + swagger setup
  controllers/                  → HTTP handlers by domain
  routes/                       → auth, users, events, notifications endpoints
  services/                     → business logic + email + notifications
  models/                       → PostgreSQL access layer
  middlewares/                  → authentication + validation
  schemas/                      → Zod request validation
  docs/openapi.yaml             → API contract source
database/migrations/            → SQL migrations
scripts/                        → migration, seed and utility scripts
tests/                          → unit/integration tests
```

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTS.md (Bootloader)                    │
│              You are here. Load order below.                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌───────────┐ ┌──────────────────┐
│  .agent/system/  │ │  Roles    │ │    Skills        │
│                  │ │           │ │                  │
│ orchestrator.md  │ │ Activated │ │ Tier 0: always   │
│ alignment.md     │ │ per task  │ │ Tier 1: tech     │
│ auto-learning.md │ │ context   │ │ Tier 2: on-demand│
└─────────────────┘ └───────────┘ └──────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Memory (Taxonomie Cognitive)                 │
│  working/ · episodic/ · semantic/ · procedural/             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Boot Sequence

Every agent session MUST follow this loading order:

### Phase 1 — Core (Always Load, in this order)

1. **`00-reasoning.md`** (Skill 00) — FIRST TOKEN, always
2. **`AGENTS.md`** — Identity, structure, protocols
3. **`.agent/system/alignment.md`** — Constraints (IMMUTABLE)
4. **`.agent/system/orchestrator.md`** — Context routing engine (IMMUTABLE)
5. **`.agent/system/auto-learning.md`** — Knowledge enrichment (IMMUTABLE)
6. **`11-agent-behavior.md`** (Skill 11) — Behavior rules

### Phase 2 — Skill Routing (Task-Dependent)

Load skills by tier based on the task:

- **Tier 0** — `.agent/rules/tier-0/` → ALWAYS loaded
- **Tier 1** — `.agent/rules/tier-1/` → Load if technical task
- **Tier 2** — `.agent/rules/tier-2/` → Load specific skill on-demand

### Phase 3 — Role + Context Activation (Task-Dependent)

Load the appropriate **role** from `.agent/roles/` and the relevant **context map section** from `.agent/memory/semantic/`.

---

## 🔧 Roles

Active roles for this repository:

- `backend-engineer.md`
- `api-security-reviewer.md`

Use both roles for auth, token, permission, validation or data exposure topics.

## 🧭 Task Detection Table

| Signal keywords | Domain | Tier 1 Skills | Tier 2 Skills | Context Map |
|---|---|---|---|---|
| route, endpoint, controller, status code | API | `05-api-standards.md`, `03-security.md` | — | `api-contracts.md` |
| postgres, migration, model, query, transaction | Database | `04-database.md`, `03-security.md` | — | `domain-models.md`, `infrastructure.md` |
| jwt, auth, middleware, token, refresh | Security/Auth | `03-security.md`, `05-api-standards.md` | — | `api-contracts.md`, `codebase-overview.md` |
| invitation, invite, join, participant | Event Collaboration | `05-api-standards.md`, `03-security.md` | — | `api-contracts.md`, `domain-models.md` |
| exclusion, draw, assignment, secret santa | Draw Logic | `04-database.md`, `05-api-standards.md`, `03-security.md` | — | `domain-models.md`, `api-contracts.md` |
| notification, unread, read-all, email, smtp | Notification Delivery | `05-api-standards.md`, `03-security.md` | — | `api-contracts.md`, `infrastructure.md` |
| zod, schema, validation middleware, payload | Input Validation | `03-security.md`, `05-api-standards.md` | — | `codebase-overview.md`, `api-contracts.md` |
| bug, regression, failing test, jest | Debug/Test | `06-testing.md` | — | `codebase-overview.md`, `known-pitfalls.md` |
| swagger, openapi, docs | API Documentation | `05-api-standards.md` | — | `api-contracts.md` |

---

<CRITICAL_DIRECTIVES>

1. **Static analysis is a hard gate** — lint + typecheck must pass before claiming completion
2. **NEVER disable rules silently** — fix the code, not the gate
3. **`@ts-ignore`, `@ts-nocheck` FORBIDDEN** by default
4. **Destructive operations require explicit confirmation** — ⚠️ warn first
5. **Never expose secrets or credentials** in responses

</CRITICAL_DIRECTIVES>
