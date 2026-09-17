# PriceMatch automated alerts

## Account flow
- `POST /api/auth/register` creates an account and starts a 30-day HTTP-only session.
- `POST /api/auth/login` signs in.
- `POST /api/auth/logout` ends the session.
- `GET /api/auth/me` returns the current account.

Passwords are hashed with Node's built-in `scrypt`; raw passwords are never stored.

## Scheduled checks
Call `POST /api/alerts/check` from a trusted scheduler. If `CRON_SECRET` is set, send `Authorization: Bearer <CRON_SECRET>`.

Each check refreshes active account watchlists, persists new price snapshots, and triggers one notification when the lowest landed price reaches the user's target and is lower than the previously alerted price.

Email delivery is optional. Set `RESEND_API_KEY` and `ALERT_FROM_EMAIL` to send through Resend. Without those values, the notification is recorded in `NotificationLog` with channel `log`, which makes local testing easy.

For production, use PostgreSQL instead of SQLite and a managed scheduler that runs the endpoint at a controlled cadence.
