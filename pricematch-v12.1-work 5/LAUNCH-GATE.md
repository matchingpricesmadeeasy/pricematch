# PriceMatch Launch Gate

A production deployment should not proceed until every gate below is checked in staging.

## Automated
- `npm install`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`
- `npm run test:qa`
- `npm run db:migrate` / `prisma migrate deploy` against a disposable PostgreSQL database

## Runtime
- `GET /api/health` returns HTTP 200.
- `GET /api/ready` returns HTTP 200 only when PostgreSQL is reachable.
- Search returns live offers when retailer credentials are configured.
- Search errors do not display demo prices.
- Exact identifiers produce exact matches; conflicting variants are excluded.
- Deal clicks only redirect to approved retailer hosts.
- Watchlist ownership works for authenticated accounts.
- Alert cron rejects missing/invalid authorization.

## Business launch checks
- Retailer API access is approved and within quota.
- Affiliate terms and tracking parameters are approved before enabling monetization.
- Privacy policy and terms are published.
- Production secrets are stored in the hosting provider, not committed to git.
- Database backup/restore has been tested.
- A rollback deployment is available.
