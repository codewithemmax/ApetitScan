# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase
* Pivot from PetitScan (allergen scanner) to ApetitScan (African food intelligence: carbohydrate estimate, Sugar Spoon Index, Meal Impact, Buffer Engine). Context files rewritten on 2026-09-29; Unit 1-7 implementation work is underway.

## Current Goal
* Ship a working end-to-end demo of the two demo plates for the StacStart Borderless Bytes hackathon, submission deadline September 30, 2026 (confirm the cutoff time). Reuse the existing auth, history, multi-page, and provider plumbing; replace the allergen domain logic, data, and UI copy.

## Current State
* App name: ApetitScan (replaces PetitScan). Code, metadata, README, and `.codexrules` may still say PetitScan.
* Pre-pivot baseline, as last recorded on 2026-09-28 (unverified, audit first in Unit 1):
  * Stack: Next.js (App Router), Tailwind, Supabase, Gemini primary with Groq fallback, Vercel Hobby.
  * Auth and multi-page work: Supabase Auth pages and route protection were being finished; manual Auth verification was still pending.
  * Data: `profiles`, `dish_cache`, `dish_ingredients`, `allergy_profiles`, and `scans` were part of the retrofit; a legacy standalone `users` table exists from the original demo migration. The additive `scans.ingredients` migration still needed to be run in Supabase. A Unit 14 seed migration (five verified allergen-era dishes, including Egusi soup, Jollof rice, and Moin moin) still needed to be applied.
  * API: `POST /api/scan`, `/api/match`, `/api/ask-cook`, with history endpoints planned or partly built. These were allergen-era.
  * Frontend: tiered ingredient display, qualitative nutrition cues, and a blue visual system (ice blue, cobalt, navy) were added. Routes and design pass may be partly done.
  * Verification: `git diff --check` passed; the production build and standalone TypeScript check did not finish in the resource-constrained workspace and were stopped.
* The tracker header from before the pivot ("retrofit audit, not implemented yet") conflicted with the session notes below it. Treat the real repo state as unknown until Unit 1 reports it.

## Completed
* Original local demo scaffold (Next.js/Tailwind, local dish data, scan/match/ask-cook handlers).
* Pre-pivot units as recorded: nutrition and blue-theme pass (2026-09-28), source/safety/security audit pass and two extra allergen-era dishes. These are reusable only for plumbing and visuals, not domain logic.
* Rewrite of context files 1-7 for ApetitScan (2026-09-29).

## In Progress
* Unit 1 is complete. Unit 2 migration was manually applied by the user; cross-user RLS verification is unconfirmed. User reports applying the Unit 3 seed; row-level verification remains pending. Unit 4-6 code and Unit 7-8 endpoints are implemented; acceptance checks remain pending.

## Next Up
* Unit 2: cross-user RLS verification remains unconfirmed.
* Unit 3: verify the user-applied demo food seed rows in Supabase before marking complete.
* Unit 4: run acceptance checks on both demo photos, Gemini-to-Groq fallback, and malformed output before marking complete.
* Unit 5: run fixture acceptance checks for both demo plates, widened unconfirmed portions, and missing/unverified rows before marking complete.
* Unit 6: run fixture acceptance checks for the confidence formula, both demo-plate impact bands, and a boundary-straddling range before marking complete.
* Unit 7: verify both demo photos, the unidentified-photo question, per-step 70% confirmation prompts, authentication, and scan persistence.
* Unit 8: verify both demo estimates, disclaimer presence, missing-row ask behavior, and owner-only scan updates.
* Unit 9 code is implemented; verify Buffer feasibility/gating, recalculation after correction, and correction-row owner scoping manually.
* Unit 10 code is implemented; verify newest-first history, null-safe legacy rows, and owner-only deletion manually.
* Units 11-12 code is implemented; phone-sized visual and end-to-end acceptance remain pending.
* Unit 13: static safety/key review and mocked provider-fallback checks passed; runtime two-user RLS verification and a completed production bundle audit remain pending.
* Unit 14: deployment, demo rehearsal, and documentation pass.

## Open Questions
* Supabase project credentials, and whether email confirmation is enabled on the deployed project.
* Hackathon submission cutoff time, required submission materials, and track (the old files named the Access & Inclusion track; the new brief does not).
* Whether the team is solo or has a confirmed second person, and if so, how work is split.
* Sources and reviewer for the verified carbohydrate ranges per food, preparation, and portion.
* Meal Impact prototype rule is set: midpoint bands Low <50 g, Moderate 50–100 g, High >100 g; vegetable, protein, and preparation context are explanatory drivers only. A boundary-crossing range is flagged. Thresholds are user-approved prototype rules, not clinical cutoffs.
* Sugar Spoon convention. Default: 1 spoon = 4 g of carbohydrate.
* Ask-thresholds per step, and the overall confidence rule. Default: overall equals the lowest of vision, portion, nutrition.
* Verified set: keep it Nigerian only (this pack), or include other African dishes the brief hints at.
* Whether any of the five allergen-era dishes are worth keeping as ApetitScan foods (they carry no carbohydrate data, so likely no).

## Architecture Decisions
* The vision model identifies; the Nutrition Engine calculates from verified rows. No model-supplied nutrition numbers.
* Carbohydrates are always a range; the disclaimer is always on screen with Sugar Spoon and Meal Impact.
* Legacy allergen tables and columns are frozen, not dropped, because migrations are additive only. `/api/match` and `/api/ask-cook` routes are retired in code.
* `meal_prepared` gates the Buffer Engine so an already-cooked meal never gets a "replace" suggestion.
* Corrections are stored per scan; automatic model or database updates from corrections are post-MVP and pitch-only.

## Session Notes
* 2026-09-29 pivot: new product brief adopted (ApetitScan replaces PetitScan). Context files 1-7 rewritten. Old deadline of September 28 (11:59 PM WAT) is superseded by September 30, 2026. Legacy `.codexrules` still needs a check for allergen-era rules.
* 2026-09-28 nutrition and blue-theme pass (PetitScan): added tiered ingredient display and qualitative, ingredient-derived nutrition cues on new scans and in history. Added an additive `scans.ingredients` migration; it still needs to be run in Supabase. Shared visual tokens set to ice blue, cobalt, and navy. `git diff --check` passed; production build and standalone TypeScript check did not finish in the resource-constrained workspace and were stopped.
* 2026-09-27 retrofit audit (PetitScan): all seven binding context files and `.codexrules` reread. Gap list reported before migration work, per request.
* Daily control loop: pull latest, review this file, complete one unit from `7-units.md`, test it against the verification checklist in `5-ai-workflow-rules.md`, commit, update this file with what's next.

## Unit 1 Audit and Changes (2026-09-29)
* Audit complete before changes. Reusable: Supabase Auth pages, middleware route protection, authenticated history/delete plumbing, the existing Gemini-to-Groq wrapper structure, and the shared blue Tailwind tokens.
* Retired: allergen scan UI, legacy allergen components/services/types/data, allergen-era API documentation, and the old /api/match and /api/ask-cook route files. The scan page is now a non-functional Unit 1 placeholder until the ApetitScan contract is implemented in later units.
* Renamed live product strings, metadata, package name, README, and .codexrules to ApetitScan. Database migration names and legacy table names were intentionally preserved.
* Schema audit: only the original users, profiles retrofit, legacy dish_cache, dish_ingredients, allergy_profiles, and minimal scans definitions exist in migration history. scans.user_id currently references legacy users, source is legacy NOT NULL with an allergen-era check, and 202609280001_scan_ingredients.sql contains only w, so it is not an applied ingredients migration. No ApetitScan foods, food_nutrition, scan_corrections, new scans columns, or RLS migration exists yet.
* Contradictions found: README was obsolete Macro/Express/MongoDB documentation; the former home route was invalid placeholder content; the history and signup surfaces still described allergen workflows. These are corrected within Unit 1. The schema contradiction is intentionally deferred to Unit 2 because this unit forbids database changes.
* Unit 2 must treat legacy scans constraints as insert blockers: preserve legacy columns/tables, add the documented columns and RLS additively, and relax only legacy NOT NULL/check constraints that prevent authenticated ApetitScan inserts. Do not edit or reuse the malformed prior migration; add a new migration.
* 2026-09-29 Unit 2: added the additive ApetitScan schema migration 202609290001_apetitscan_schema.sql. It creates foods, food_nutrition, and scan_corrections, adds the documented result fields and checks to scans, relaxes only the legacy source NOT NULL constraint, indexes user/foreign-key access paths, and scopes scans and scan_corrections policies to auth.uid(). User reports manually applying the SQL in Supabase; cross-user RLS testing is unconfirmed.
* 2026-09-29 Unit 3: drafted the sourced demo food seed migration and documented its coverage and assumptions. User reports applying it through the Supabase SQL editor; seeded-row verification is not available from this workspace.
* 2026-09-29 Unit 4: added `lib/ai/identifyMeal.ts` with Gemini primary, Groq fallback, identification-only prompt, strict unknown-response validation, portion/preparation guesses, per-step confidence, and provider timeouts. Documented its input/output and manual acceptance steps in `API.md`; acceptance checks remain pending.
* 2026-09-29 Unit 5: added pure verified-row nutrition range aggregation and clarification handling, adjacent-tier widening for unconfirmed portions, disclosed preparation assumptions, outward-rounded Sugar Spoon conversion using the 4 g default, shared range formatting, and the required disclaimer constant. Documented the behavior in `API.md`; fixture acceptance checks remain pending. The workspace denied creation of new `lib/config` and `lib/constants` directories, so their values currently live in `lib/services/nutritionConfig.ts`. `tsc --noEmit` produced no output but did not finish within 60 seconds and was stopped.
* 2026-09-29 Unit 6: added the clamped minimum-rule confidence engine and midpoint-only impact classification using the user-approved 50 g / 100 g thresholds. Vegetables, protein, and preparation are explanatory drivers only. Boundary straddles are flagged without an additional penalty factor; the specified range-tightness confidence formula applies as written. Documented formulas and threshold basis in `API.md`; fixture acceptance checks remain pending.
* 2026-09-29 Unit 7: implemented authenticated multipart image handling, verified catalogue/preparation lookup, exact food matching, per-step 70% confirmation questions, unidentified-food fallback question, and RLS-scoped scan persistence. Photos are not retained and no nutrition values are emitted. Documented request/response, limits, threshold basis, and acceptance steps in `API.md`; manual checks remain pending.
* 2026-09-29 Unit 8: implemented authenticated estimate requests bound to the caller's saved component IDs, verified-row-only nutrition lookups, confidence/impact/spoon calculations, clarification behavior for missing or uncertain inputs, disclaimer inclusion, and owner-scoped scan updates. Documented the JSON contract and manual acceptance checks in `API.md`; acceptance remains pending.
* 2026-09-29 Unit 9: added authenticated Buffer and correction endpoints. Buffer actions are feasibility-ranked, saved with `meal_prepared`, and omit Prepare actions for already-prepared meals. Corrections validate against verified foods and nutrition preparations, write to `scan_corrections` plus the owner's scan only, and recalculate through the shared estimate builder. Added API contracts and manual acceptance checks; runtime and database acceptance remain pending.
* 2026-09-29 Unit 10: updated authenticated history to return owner-scoped scans newest first with Meal Impact, carbohydrate and Sugar Spoon ranges, status, and timestamp; older rows with absent/invalid estimate bounds safely return null ranges. Tightened owner-only deletion to return 404 for missing or non-owned scans while retaining RLS enforcement. Documented response shapes and manual acceptance steps; database acceptance remains pending.
* 2026-09-30 Units 11-12: implemented scan flow and shared responsive screens, palette, saved history detail, and exact result disclaimer. Phone-sized visual and end-to-end acceptance remain pending.
* 2026-09-30 Unit 13 pass: scanned app/components/lib for prohibited safety and credibility wording; remaining matches are the exact approved disclaimer, required "not medical advice" footer, code identifiers, or safe-area CSS. Confirmed the active AI prompt is identification-only and provider keys are only read from server-side environment names; public env references are the approved Supabase URL/anon key. Mocked Gemini 429 -> Groq success and both-provider failure paths pass. Fixed Home disclaimer gating for impact/range data. RLS policies and owner filters were reviewed, but cross-user database behavior is not runtime-verified because no Supabase CLI/test identities are available. No production client JS bundles were generated for bundle-level secret scanning.
