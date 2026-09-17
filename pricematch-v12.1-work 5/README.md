# PriceMatch v12.1 — Launch Hardening Candidate

This version hardens retailer redirects, removes legacy project clutter from the launch package, and keeps server-side deal click tracking.

## Real retailer adapters
- **Amazon Creators API:** OAuth 2.0 token caching, `SearchItems` for keyword/model searches, `GetItems` for ASIN lookups, offer price extraction, and Amazon detail-page URLs. Amazon's current documentation says Creators API uses OAuth 2.0 and provides Node.js SDKs; this implementation uses the documented HTTP flow directly. citeturn1search1turn1search3
- **Best Buy Products API:** catalog search with pricing/availability fields and request timeouts. Best Buy documents pricing and availability in its Products API. citeturn0search1
- **Walmart Item Search API:** keyword, UPC, GTIN, and US ASIN/spec searches using the documented `/v3/items/walmart/search` endpoint. citeturn0search0turn0search6

## Deal click tracking
`POST /api/deal/click` accepts a stored `offerId`, validates the destination against an allowlist, records the click, and returns the destination URL.

See `AFFILIATE.md` for the affiliate-link strategy.

## Local setup
```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

For demo mode, set `USE_DEMO_DATA=true`. For live providers, set the credentials in `.env.local`.

## Important production note
Retailer access and affiliate programs have their own eligibility, rate limits, terms, and attribution requirements. Keep those credentials server-side and only enable a retailer after its access/affiliate requirements are satisfied.

## Production infrastructure
This release combines the launch experience, accounts, watchlists, alerts, retailer integrations, analytics, PostgreSQL configuration, health/readiness checks, security headers, and end-to-end launch gates.

## Staging deployment
A production-ready container recipe is included in `Dockerfile`. It uses Next.js standalone output, generates Prisma Client during build, and applies committed PostgreSQL migrations at container startup. See `STAGING.md` for the launch-gate runbook.
