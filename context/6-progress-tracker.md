# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase
* Retrofit audit: the original local demo is scaffolded, but the updated authenticated multi-page architecture is not implemented yet.

## Current Goal
* Retrofit the existing demo into the updated Supabase-authenticated app: additive schema/RLS migration, Auth pages and protection, persisted scan history, seven routes, then the design pass.

## Current State
* App name: PetitScan (confirmed).
* Existing frontend: one client-rendered `/` page with a hardcoded profile switcher, upload form, result card, and local demo dish selector.
* Existing API: `POST /api/scan`, `POST /api/match`, and `POST /api/ask-cook`; scan is local catalog lookup only and does not authenticate, call Gemini/Groq, or persist a scan.
* Existing data: one legacy migration creates a standalone `users` table and lacks `profiles`, `flags`, auth foreign keys, and RLS policies.
* Existing verified demo catalog: Egusi soup, Jollof rice, and Moin moin are represented in local TypeScript data, not in Supabase `dish_cache` tables.
* Existing documentation: `API.md` describes the three original endpoints and the local demo limitation.
* Environment template exists, but no authenticated Supabase client or provider integration is implemented.

## Completed
* Original local demo scaffold: Next.js/Tailwind setup, local dish data, scan/match/ask-cook route handlers, and initial additive-schema attempt.

## In Progress
* Unit 6 authenticated scan endpoint added; cache, AI fallback, and scan-history verification remain manual.

## Next Up
* Unit 3: finish manual Auth verification.
* Unit 5: force a Gemini failure and verify Groq returns a structured result.
* Unit 6: verify authenticated cache hit, cache miss fallback, and one owned `scans` row, then proceed to Unit 7.
* Units 6 and 9: connect authenticated scan persistence and add history endpoints.
* Units 10-13: add the home, profile, scan, history routes and reconcile the visual system.

## Open Questions
* Supabase project credentials and whether email confirmation is enabled for the deployed project.
* Final dish list and hand-verification sources for the Supabase seed data.
* Whether the team is solo or has a confirmed second person, and if so, how work is split.

## Architecture Decisions
* The existing standalone `users` table is legacy and does not satisfy the updated architecture; the retrofit must add `profiles` and reference `auth.users`.
* The legacy migration must remain unchanged; the updated schema must be delivered as a new additive migration.
* The local demo catalog is not a substitute for the required Supabase-backed cache in the authenticated release flow.

## Session Notes
* 2026-09-27 retrofit audit: all seven binding context files and `.codexrules` reread. Gap list reported before migration work, per request.
* Target: working end-to-end demo for StacStart's Borderless Bytes hackathon, submission deadline September 28, 2026, 11:59 PM WAT.
* Daily control loop: pull latest, review this file, complete one unit from `7-units.md`, test it against the verification checklist in `5-ai-workflow-rules.md`, commit, update this file with what's next.
