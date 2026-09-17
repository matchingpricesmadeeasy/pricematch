# PriceMatch v11 — Production Hardening

This release focuses on operational readiness rather than adding another consumer feature.

## Added
- `/api/health` liveness endpoint.
- `/api/ready` readiness endpoint with a database connectivity check.
- `robots.txt` and `sitemap.xml` through Next.js metadata routes.
- Security response headers: nosniff, strict referrer policy, frame protection, and permissions policy.
- Production environment template using PostgreSQL.
- Typecheck script.

## Validation note
Run `npm install`, `npm run db:generate`, and `npm run typecheck` locally/CI before deployment. Then run `npm run build` against the production environment.

## Recommended deployment gates
1. Database migration succeeds.
2. `/api/health` returns HTTP 200.
3. `/api/ready` returns HTTP 200 with database available.
4. Demo mode is disabled in production.
5. Retailer credentials are configured and verified.
6. Cron secret is configured and scheduled job authentication is tested.
7. Affiliate destinations are allowlisted.
8. Search, watchlist, alert, and deal-click smoke tests pass.
