## 2026-04-07 - Profile Avatar Allowlist

- Added strict backend support for `profile_image` on `POST /api/auth/register`, `GET /api/auth/me`, and `PUT /api/users/me`.
- Enforced a server-side allowlist limited to:
  - `/avatars/avatar-1.svg`
  - `/avatars/avatar-2.svg`
  - `/avatars/avatar-3.svg`
  - `/avatars/avatar-4.svg`
  - `/avatars/avatar-5.svg`
- Register policy: `profile_image` is optional and defaults to `/avatars/avatar-1.svg`.
- Added migration `database/migrations/005_add_profile_image_column.sql`:
  - creates `users.profile_image`
  - canonicalizes legacy values `avatar-1..avatar-5`
  - backfills unknown/empty values to `/avatars/avatar-1.svg`
  - enforces `NOT NULL`, default, and `CHECK` allowlist constraint.
- Added/updated unit and integration tests for schema validation, routes, and migration constraints.

