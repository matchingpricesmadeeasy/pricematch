# PriceMatch engine

Browser -> POST /api/search -> normalize input -> retailer adapters -> normalize offers -> product-match scoring -> sort by landed cost -> JSON response.

Matching priority:
1. UPC / GTIN / ASIN exact identifiers
2. Model/brand signals
3. Title-token similarity

Title similarity alone is never labeled as an exact match.

Current total = item price + shipping. Tax comes later because it depends on destination and retailer.

Provider adapters isolate credentials, schemas, rate limits and retailer-specific behavior. Add new retailers by implementing `RetailerProvider`.

Production checklist:
- database for products, offers and price snapshots
- caching/rate limits
- affiliate-link handling
- monitoring
- automated matching tests
- never expose API credentials client-side


## Persistence layer

Searches optionally persist through `lib/history.ts`. A canonical product is upserted first, identifiers are attached, retailer sources are normalized, current offers are updated, and every observed price becomes a `PriceSnapshot`. This keeps the comparison path fast while preserving historical observations for charts and alerts.
