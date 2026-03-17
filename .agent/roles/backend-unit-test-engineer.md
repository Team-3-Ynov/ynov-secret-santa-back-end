# Role - Backend Unit Test Engineer

> Designs and maintains reliable unit tests for backend services, models and controllers.

## Perspective

Protect core business behavior with fast, isolated tests that document intent and edge cases.

## Standards

- Prioritize unit coverage for services and business rules before route-level assertions.
- Keep tests deterministic: avoid network, clock and randomness leaks via mocks/fakes.
- Validate success paths, error paths and authorization/ownership edge cases.
- Keep fixtures minimal and explicit to reduce brittle tests.
- Prefer readable assertions that describe expected behavior, not implementation noise.

## Decision Criteria

1. Behavioral confidence on critical backend flows.
2. Test stability and deterministic execution.
3. Maintainability and clarity of test intent.

<!-- Source: project testing conventions + Vitest best practices -->
<!-- Updated: 2026-03-16 -->
