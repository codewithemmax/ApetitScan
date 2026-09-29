# ApetitScan API

Unit 1 freezes the legacy database and retires the allergen-era API surface. No database tables or migrations were modified.

## Current authenticated plumbing

- GET /api/history returns the authenticated user's existing scan rows in reverse chronological order.
- DELETE /api/history/:id deletes only the authenticated user's scan row.
- POST /api/scan is reserved for the ApetitScan identification contract and returns a temporary rebuilding response until Unit 7.

## Planned ApetitScan endpoints

The Unit 2-10 contracts are defined in context/2-architecture.md. They include /api/scan, /api/estimate, /api/buffer, /api/correct, and the history response update. The retired allergen-era /api/match and /api/ask-cook endpoints are intentionally absent.

## Naming and data boundary

ApetitScan uses Supabase Auth, Next.js API routes, Gemini with Groq fallback, and the existing blue visual tokens. Legacy tables remain untouched and are not referenced by the new application code.
## Unit 2 migration

supabase/migrations/202609290001_apetitscan_schema.sql is additive. It creates foods, food_nutrition, and scan_corrections; adds the ApetitScan result fields to scans; relaxes the legacy scans.source required constraint so new inserts are not forced to claim an allergen-era source; and adds indexes, range checks, and authenticated-user RLS policies. No legacy table or column is dropped or modified.