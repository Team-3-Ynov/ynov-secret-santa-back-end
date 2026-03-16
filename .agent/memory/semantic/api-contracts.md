<!-- api-contracts.md - Retrieval-Aware Format -->
<!-- Updated: 2026-03-16 -->

## INDEX
- [Auth API](#auth-api) - register, login, refresh, logout
- [User API](#user-api) - profile and password
- [Events API](#events-api) - lifecycle, invitations, exclusions, draw
- [Notifications API](#notifications-api) - list, unread count, read state

## <section id="auth-api"> Auth API

- Base path: `/api/auth`.
- Main routes: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`.
- JWT access token and refresh token workflows must stay contract-compatible with frontend.

</section>

## <section id="user-api"> User API

- Base path: `/api/users`.
- Main routes: `GET /me`, `PUT /me`, `PUT /me/password`, `GET /:id/public`.
- Auth required for user profile access.

</section>

## <section id="events-api"> Events API

- Base path: `/api/events`.
- Event lifecycle routes: create, list, read, update, delete.
- Collaboration routes: invite, cancel invitation, join, participants.
- Draw rules routes: add/list/delete exclusions, run draw, get own assignment.

</section>

## <section id="notifications-api"> Notifications API

- Base path: `/api/notifications`.
- Main routes: list notifications, unread count, mark one/all as read.
- Notification payload should remain stable for frontend badges and lists.

</section>
