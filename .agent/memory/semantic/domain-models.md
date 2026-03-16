<!-- domain-models.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [User And Auth](#user-and-auth) - users, refresh tokens
- [Event Domain](#event-domain) - events, invitations, exclusions, assignments
- [Notification Domain](#notification-domain) - notifications, unread counters

## Activation Matrix

- Context: User And Auth
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `03-security.md`, `05-api-standards.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/orchestrator.md`

- Context: Event Domain
- Roles: `backend-engineer.md`
- Tier 1 Skills: `04-database.md`, `05-api-standards.md`, `03-security.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/system/auto-learning.md`

- Context: Notification Domain
- Roles: `backend-engineer.md`, `api-security-reviewer.md`
- Tier 1 Skills: `05-api-standards.md`, `03-security.md`
- Core Rules: `.agent/system/alignment.md`, `.agent/rules/tier-0/11-agent-behavior.md`

## <section id="user-and-auth"> User And Auth

- `user.model.ts` stores account profile data.
- `refresh_token.model.ts` manages refresh token persistence and session continuity.
- Auth routes/controllers handle register, login, refresh and logout flows.

</section>

## <section id="event-domain"> Event Domain

- `event.model.ts` stores event metadata and ownership.
- `invitation.model.ts` manages invitations to join events.
- `exclusion.model.ts` models draw exclusion constraints between participants.
- `assignment.model.ts` stores draw result mappings (giver -> receiver).

</section>

## <section id="notification-domain"> Notification Domain

- `notification.model.ts` stores per-user notifications and read state.
- Notification service provides unread count and mark-as-read flows.
- Draw operations trigger notification creation and outbound email.

</section>
