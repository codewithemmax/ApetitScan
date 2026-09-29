# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase
* Pivot from PetitScan (allergen scanner) to ApetitScan (African food intelligence: carbohydrate estimate, Sugar Spoon Index, Meal Impact, Buffer Engine). Context files rewritten on 2026-09-29. No ApetitScan code has been written yet.

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
* Nothing in code. Next action is Unit 1 (pivot audit and legacy freeze).

## Next Up
* Unit 1: audit the repo against these files, report the gap list, then retire the allergen UI and routes and rename the product.
* Unit 2: additive migration for `foods`, `food_nutrition`, new `scans` columns, and `scan_corrections`, with RLS.
* Unit 3: hand-verify and seed the foods needed for the two demo plates, with a source for every row.
* Units 4-10: vision wrapper, engines, endpoints, corrections, history.
* Units 11-12: scan flow UI, then home, profile, and history rework.
* Units 13-14: safety and credibility pass, deploy, demo rehearsal.

## Open Questions
* Supabase project credentials, and whether email confirmation is enabled on the deployed project.
* Hackathon submission cutoff time, required submission materials, and track (the old files named the Access & Inclusion track; the new brief does not).
* Whether the team is solo or has a confirmed second person, and if so, how work is split.
* Sources and reviewer for the verified carbohydrate ranges per food, preparation, and portion.
* Meal Impact bands: thresholds and modifiers (composition, preparation, GI category), and the basis for each. Default: midpoint of the total range, confidence reduced when the range straddles a boundary.
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
* 2026-09-29 Unit 2: added the additive ApetitScan schema migration 202609290001_apetitscan_schema.sql. It creates foods, food_nutrition, and scan_corrections, adds the documented result fields and checks to scans, relaxes only the legacy source NOT NULL constraint, indexes user/foreign-key access paths, and scopes scans and scan_corrections policies to auth.uid(). Existing migrations and legacy tables remain untouched. Live Supabase application and cross-user RLS testing are still pending.