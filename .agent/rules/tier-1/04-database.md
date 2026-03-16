# Skill 04 - Database

> Keep PostgreSQL access predictable, safe and migration-driven.

## Data Access Rules

- Keep SQL and persistence concerns in `src/models`.
- Keep business orchestration in `src/services` and avoid SQL in controllers.
- Use explicit column lists for reads/writes where possible.

## Migrations

- Every schema change must be represented by a SQL file in `database/migrations`.
- Migration scripts must be idempotent when feasible and safe to rerun in CI/dev.
- Update semantic memory maps after adding new tables, columns or constraints.

## Query Safety

- Use parameterized queries only.
- Prefer explicit transaction boundaries for multi-step write flows.
- Validate foreign keys and ownership before mutating event-linked entities.

## Performance Baseline

- Add indexes for frequent lookup fields (event id, user id, notification state).
- Avoid unbounded list endpoints; support clear sorting and pagination strategy when needed.

<!-- Source: PostgreSQL best practices + project models layout -->
<!-- Updated: 2026-03-16 -->
