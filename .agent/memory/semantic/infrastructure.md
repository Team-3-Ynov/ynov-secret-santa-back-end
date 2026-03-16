<!-- infrastructure.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [Runtime](#runtime) - node, express, scripts
- [Database](#database) - postgres, migrations
- [Email And Docs](#email-and-docs) - mailhog, swagger

## <section id="runtime"> Runtime

- Node.js 20+ runtime.
- Main scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`.
- Docker compose profiles support infra-only and full stack setups.

</section>

## <section id="database"> Database

- PostgreSQL is required for local and production environments.
- SQL migrations are tracked under `database/migrations`.
- Migration command: `pnpm migrate`.

</section>

## <section id="email-and-docs"> Email And Docs

- SMTP development flow targets MailHog (`1025` SMTP, `8025` UI).
- OpenAPI docs are served at `/api-docs` and based on `src/docs/openapi.yaml`.

</section>
