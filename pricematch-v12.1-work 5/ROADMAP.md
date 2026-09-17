# PriceMatch roadmap

## Completed
- Variant-aware product matching
- Canonical products + identifiers
- Price snapshots + history
- Accounts + sessions
- Watchlists + target prices
- Automated alert checks
- Amazon Creators API HTTP adapter with OAuth token caching
- Best Buy catalog adapter hardening
- Walmart Item Search adapter hardening
- Server-side deal click tracking + retailer-host allowlist

## Next
1. Add retailer-specific affiliate/deep-link credentials and attribution rules.
2. Add scheduled production jobs with distributed locking and provider quotas.
3. Add Target/Home Depot adapters only through approved data-access paths.
4. Add analytics dashboards for match rate, stale offers, provider errors, and outbound clicks.
5. Move production database from SQLite to PostgreSQL and add durable job infrastructure.
