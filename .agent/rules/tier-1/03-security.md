# Skill 03 - Security

> Enforce backend security controls for auth, data access and outbound communication.

## Auth And Authorization

- Protect private routes with `authenticate` middleware before controller handlers.
- Verify ownership checks at service/model level for event-scoped operations.
- Treat JWT as untrusted input until signature and expiry validation succeeds.

## Input And Output Safety

- Validate request boundaries with Zod schemas before business logic.
- Return sanitized API errors without leaking stack traces or secrets.
- Never expose password hashes, refresh token values or internal IDs not required by contract.

## Secret And Runtime Safety

- Read secrets from environment variables only.
- Never hardcode credentials in code, tests, fixtures or docs examples.
- Keep SMTP, JWT and database configuration centralized in `src/config` and `.env`.

## Security Review Checklist

- [ ] Route is authenticated when required.
- [ ] Input validation exists and rejects malformed payloads.
- [ ] Response does not expose sensitive fields.
- [ ] Logging avoids PII and credentials.

<!-- Source: OWASP ASVS + project conventions -->
<!-- Updated: 2026-03-16 -->
