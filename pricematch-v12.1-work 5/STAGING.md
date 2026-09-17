# PriceMatch v12.2 — Staging Runbook

## 1. Required environment
Set these in the staging platform's secret/environment manager. Do not commit them.

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `SESSION_SECRET`
- `CRON_SECRET`
- `USE_DEMO_DATA=false`
- `PERSIST_SEARCHES=true`
- `AMAZON_ACCESS_TOKEN` or the Amazon credentials required by the current adapter
- `BESTBUY_API_KEY`
- `WALMART_ACCESS_TOKEN`
- Optional: `RESEND_API_KEY`, `ALERT_FROM_EMAIL`

## 2. Build
The production Dockerfile runs:

1. `npm ci`
2. `prisma generate`
3. `npm run build`
4. `prisma migrate deploy` at container startup

A deployment is not considered healthy unless the build completes and `/api/health` returns HTTP 200.

## 3. Database
Use a dedicated PostgreSQL database for staging. Verify `/api/ready` after startup. Do not use `prisma db push` against production/staging; use the checked-in migration with `prisma migrate deploy`.

## 4. Smoke test
Run these checks in order:

1. `GET /api/health`
2. `GET /api/ready`
3. Register a test account.
4. Log in and verify `/api/auth/me`.
5. Search using a known UPC/GTIN/ASIN/model.
6. Confirm exact identifiers outrank title similarity.
7. Confirm conflicting storage/RAM/size/pack/condition variants are excluded.
8. Confirm prices include shipping in the displayed total.
9. Save a product to the watchlist.
10. Set a target price and run the protected alert check.
11. Click a real retailer offer and verify the destination host is allowlisted.
12. Confirm a failed retailer does not replace live results with demo prices.

## 5. Launch evidence
Record the deployment ID, build result, database migration result, provider response status, and smoke-test result. Keep credentials and tokens out of logs and screenshots.
