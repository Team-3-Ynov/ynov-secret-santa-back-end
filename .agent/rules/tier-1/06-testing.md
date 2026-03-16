# Skill 06 - Testing

> Protect critical backend flows with deterministic tests.

## Coverage Priorities

- Auth lifecycle: register, login, refresh, logout.
- Event lifecycle: create, invite, join, exclusions, draw, assignment read.
- Notifications: creation and read state transitions.

## Test Structure

- Keep endpoint behavior checks in `tests/routes` and `tests/controllers`.
- Keep unit tests for services/models in dedicated directories.
- Use focused fixtures to make failures diagnosable.

## Quality Gates

- Run `pnpm test` before completion claims.
- For risky changes, run `pnpm test:coverage` and inspect critical path coverage.
- Add regression test with every confirmed bug fix.

## Reliability

- Avoid flaky time-dependent assertions without control/mocking.
- Keep test data isolated per suite to prevent cross-test contamination.

<!-- Source: Jest workflow + current test folder layout -->
<!-- Updated: 2026-03-16 -->
