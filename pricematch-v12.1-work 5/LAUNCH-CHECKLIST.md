# PriceMatch v9 Launch Checklist

## Brand
- Product name: PriceMatch
- Tagline: Matching Prices Made Easy
- Keep the tagline consistent across homepage, metadata, footer, and marketing.
- Before public launch, perform a formal trademark/domain clearance for the product name.

## User experience
- Search accepts product name, URL, UPC/GTIN, ASIN, and model number.
- Results clearly separate exact/high-confidence matches from weaker matches.
- Landed cost is price + shipping; tax is not yet included.
- Show last successful retailer check.
- Handle empty, stale, unavailable, and provider-error states without silently substituting demo data.
- Mobile layout should be tested at 320px, 375px, 768px, and desktop widths.

## Production
- Set PostgreSQL DATABASE_URL.
- Configure retailer credentials and affiliate IDs.
- Configure CRON_SECRET and scheduled price checks.
- Configure email provider for alerts.
- Enable HTTPS and secure cookies.
- Apply rate limiting at the edge/API layer.
- Verify redirect allowlist for retailer deal destinations.
- Run npm ci && npm run build in CI before deployment.
- Run database migrations before first production traffic.

## Analytics
Track only what is needed for product decisions:
- search_started
- search_completed
- offer_viewed
- deal_clicked
- watch_created
- alert_triggered

Do not store raw IP addresses in application analytics.

## Launch QA
1. Search by exact UPC.
2. Search by model number.
3. Search by retailer product URL.
4. Verify variant conflicts are rejected.
5. Verify shipping is included in lowest-cost comparison.
6. Verify stale offers are visibly marked.
7. Verify deal redirects only reach allowlisted retailer domains.
8. Create watch → set target → run alert check → verify notification.
9. Verify account logout invalidates the session.
10. Test failed retailer API without breaking other retailer results.
