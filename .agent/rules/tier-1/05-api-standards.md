# Skill 05 - API Standards

> Maintain consistent REST behavior and predictable contracts across Express modules.

## Route And Handler Conventions

- Define HTTP routes in `src/routes` and delegate logic to controllers/services.
- Keep handlers thin: parse input, call service, map output, return status.
- Use resource-oriented naming under `/api`.

## Contract Consistency

- Keep OpenAPI in sync with runtime behavior (`src/docs/openapi.yaml`).
- Return structured JSON with stable keys across similar endpoints.
- Use clear HTTP status codes: 2xx success, 4xx client, 5xx server.

## Error Handling

- Return user-safe messages.
- Avoid ambiguous errors for auth failures; use consistent unauthorized/forbidden semantics.
- Preserve machine-readable error shape for frontend handling.

## Versioning And Compatibility

- Avoid breaking payload shape without migration note and frontend impact review.
- For new optional fields, preserve backward compatibility.

<!-- Source: REST style + project route/controller organization -->
<!-- Updated: 2026-03-16 -->
