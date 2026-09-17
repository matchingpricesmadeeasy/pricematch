# Retailer links & click tracking

PriceMatch keeps retailer destinations server-side. The search response contains an internal `offerId`; the browser should POST that ID to `/api/deal/click` before navigating to the returned URL.

The click endpoint:
- only accepts offers already stored by PriceMatch;
- allowlists supported retailer hosts to prevent an open-redirect vulnerability;
- records retailer, destination host, user (when signed in), and timestamp;
- returns the stored destination URL.

Affiliate tracking should be added inside each retailer adapter/provider where the retailer's program permits it. Amazon Creators API responses can provide a detail page URL tied to the Partner Tag. Other retailers should use their approved affiliate/deep-link tooling rather than arbitrary URL rewriting.
