# PriceMatch production checklist

## Database
- Use PostgreSQL in production; SQLite remains useful for local development.
- Run `prisma migrate deploy` during deployment.
- Back up the database and retain price snapshots according to your storage budget.

## Analytics
`POST /api/analytics` records privacy-conscious product events: search, result_view, deal_click, watchlist_add/remove, and alert_triggered. The endpoint intentionally stores no raw IP address or user-agent.

`GET /api/admin/metrics?days=7` returns aggregate operational metrics. Protect it with `ADMIN_METRICS_SECRET` and do not expose that secret to the browser.

## Scheduled work
Run `/api/alerts/check` from a trusted scheduler with `Authorization: Bearer $CRON_SECRET`. Keep provider polling on a schedule rather than on every page load. Add per-retailer quotas and exponential backoff when production traffic grows.

## Caching
Cache identical product searches briefly (30–120 seconds) and reuse recent provider snapshots when a retailer's freshness policy permits. Never present a stale price as live; show `last checked` timestamps.

## Affiliate attribution
Keep outbound tracking server-side. Only append retailer-approved affiliate parameters. Never fabricate affiliate IDs or redirect to unapproved domains.

## Observability
Monitor search latency, provider errors/timeouts, zero-match searches, stale offers, alert delivery failures, and deal-click conversion. Set alerts on sustained provider failure instead of individual transient errors.
