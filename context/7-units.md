# Implementation Units

Each unit is one atomic step: small enough to build, test, and commit on its own. Build in order. Do not start a unit until the previous one is done and verified against `5-ai-workflow-rules.md`.

## Unit 1: Repo Scaffold
* Scope: Next.js (App Router) + Tailwind project created. Supabase project created. Free-tier Gemini key (Google AI Studio) and free-tier Groq key obtained, no billing enabled anywhere.
* Done when: `npm run dev` runs a blank app, and all four env vars from `2-architecture.md` are set locally in `.env.local` (not committed).
* Depends on: none.

## Unit 2: Database Schema
* Scope: Additive migration creating `users`, `allergy_profiles`, `dish_cache`, `dish_ingredients`, `scans`, exactly as defined in `2-architecture.md`.
* Done when: Migration applies cleanly, foreign keys enforced, `dish_cache.dish_name` is unique.
* Depends on: Unit 1.

## Unit 3: First Verified Dish
* Scope: Hand-research and enter the ingredient/allergen data for one dish (candidate: egusi soup) into `dish_cache` and `dish_ingredients`, cross-checked against real recipe sources. Set `verified: true` only after this check.
* Done when: The data has a tier and allergen category for every ingredient row, and at least one "sometimes" tier ingredient exists to demonstrate the household-variation story.
* Depends on: Unit 2.

## Unit 4: AI Client Wrappers
* Scope: `lib/ai/identifyDish.ts` (or equivalent), a single function that calls Gemini, and on a rate-limit or error, retries against Groq. Callers never see which provider answered, only the result and a `source` field.
* Done when: Manually forcing a Gemini failure (e.g. a bad key) correctly falls through to Groq and still returns a result.
* Depends on: Unit 1.

## Unit 5: Scan Endpoint
* Scope: `POST /api/scan`. Accepts an image, checks `dish_cache` first, falls back to Unit 4's wrapper on a cache miss, returns dish name, ingredients, and `source`.
* Done when: A photo of the Unit 3 dish returns `source: "cache"` with the correct verified data; a photo of anything else returns `source: "llm_fallback"`.
* Depends on: Unit 2, Unit 3, Unit 4.

## Unit 6: Match Endpoint
* Scope: `POST /api/match`. Pure function: dish ingredients plus a user's allergy profile in, tiered flags out. No external API calls.
* Done when: Given the Unit 3 dish and a profile with a matching allergen, returns the correct flags at the correct tiers.
* Depends on: Unit 3.

## Unit 7: Ask-Cook Endpoint
* Scope: `POST /api/ask-cook`. Flagged ingredients in, one plain-language question per flag out.
* Done when: Every flag from Unit 6 produces exactly one clear question, no flag is silently dropped.
* Depends on: Unit 6.

## Unit 8: Profile Switcher (Frontend)
* Scope: Fixed local list of 2-3 demo allergy profiles, switchable in the UI. No auth.
* Done when: Switching profiles changes which allergens are checked against on the next scan.
* Depends on: Unit 1.

## Unit 9: Photo Capture (Frontend)
* Scope: `PhotoCapture` component, single primary action (take or upload a photo), calls `/api/scan`.
* Done when: A real photo of the Unit 3 dish produces a visible loading state, then a result.
* Depends on: Unit 5, Unit 8.

## Unit 10: Results Screen (Frontend)
* Scope: `ResultCard`, `AllergenFlag`, `AskCookQuestion` components. Dish name and source label (Verified/Estimated) at top, flags grouped by tier, one question per flag, a visible non-alarming disclaimer line.
* Done when: The full flow, photo in to questions out, works end to end for the Unit 3 dish, and the safety-language checklist in `5-ai-workflow-rules.md` passes on every string shown.
* Depends on: Unit 6, Unit 7, Unit 9.

## Unit 11: Expand Verified Dishes
* Scope: Repeat Unit 3 for 2-4 more dishes (candidates: jollof rice, moin moin), same hand-verification standard.
* Done when: 3-5 total dishes are `verified: true` with real, checked data.
* Depends on: Unit 3, Unit 10 (so the full flow is already proven on one dish before scaling data entry).

## Unit 12: Safety and Security Pass
* Scope: Grep the full codebase and every AI prompt template for "safe," "does not contain," "guaranteed," and any numeric certainty claim, remove or rewrite any that slipped in. Confirm no API key reaches client-side code.
* Done when: Every checklist item in `5-ai-workflow-rules.md` passes across all cached dishes.
* Depends on: Unit 10, Unit 11.

## Unit 13: Deploy and Documentation
* Scope: Deploy to Vercel (Hobby tier). Finish `API.md` with every endpoint's request/response shape and manual test steps.
* Done when: The deployed link works end to end on a phone, and a reviewer could exercise the whole flow from `API.md` alone.
* Depends on: Unit 12.
