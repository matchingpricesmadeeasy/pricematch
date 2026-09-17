# PriceMatch v12 — End-to-End Launch Candidate

This release focuses on launch-critical reliability rather than new surface features.

## Fixes
- Corrected TB-to-GB variant normalization in the product matcher.
- Removed the misleading behavior where a failed live search could silently render demo retailer prices.
- Added a clear empty/error state when no live matching offers are available.
- Bumped the health endpoint to v12.0.0.
- Switched the production database schema and migration baseline to PostgreSQL so the documented production DATABASE_URL matches Prisma.
- Added a Docker Compose PostgreSQL environment for local launch testing.
- Added a source-level QA smoke script covering critical matching, normalization, search, deal-link safety, and health checks.

## Verification limitation
Dependencies could not be installed in the build environment within the available time, so `npm run typecheck` and `npm run build` were not executed successfully here. The release must pass both commands in CI/staging before production deployment.
