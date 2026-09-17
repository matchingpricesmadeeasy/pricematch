# PriceMatch v10 — End-to-End Validation

## Local smoke test

1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run db:generate`
3. Configure a local database using `.env.example`.
4. Run migrations or `npm run db:push`.
5. Start the app: `npm run dev`.
6. Open `/` and verify the homepage renders through the Next.js app route.

## User journey

- Search by product name.
- Search by URL/identifier when provider credentials are configured.
- Confirm the product card and match confidence render.
- Confirm landed cost includes shipping.
- Confirm stale/unavailable provider responses do not become fake offers.
- Open a deal and verify the allowlisted retailer destination is used.
- Watch a product and set a target price.
- Load the history panel.
- Sign in and verify watchlist ownership.
- Run the protected alert job with `CRON_SECRET`.

## Production gate

Do not launch until real retailer credentials are configured, affiliate disclosures are reviewed, authentication is tested, scheduled jobs are running, and price freshness/error states are verified against live provider responses.
