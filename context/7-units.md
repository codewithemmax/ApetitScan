# Implementation Units

Each unit is one atomic step: small enough to build, test, and commit on its own. Build in order. Do not start a unit until the previous one is done and verified against `5-ai-workflow-rules.md`.

## Unit 1: Repo Scaffold
* Scope: Next.js (App Router) + Tailwind project created. Supabase project created with Auth enabled (email + password). Free-tier Gemini key (Google AI Studio) and free-tier Groq key obtained, no billing enabled anywhere.
* Done when: `npm run dev` runs a blank app, and all env vars from `2-architecture.md` are set locally in `.env.local` (not committed).
* Depends on: none.

## Unit 2: Database Schema and Row Level Security
* Scope: Additive migration creating `profiles`, `allergy_profiles`, `dish_cache`, `dish_ingredients`, `scans`, exactly as defined in `2-architecture.md`. RLS policies on `allergy_profiles` and `scans` scoped to `auth.uid()`.
* Done when: Migration applies cleanly, foreign keys enforced, `dish_cache.dish_name` is unique, and a manual test confirms one user cannot read or delete another user's `scans` or `allergy_profiles` rows.
* Depends on: Unit 1.

## Unit 3: Signup and Login Pages
* Scope: `/signup` and `/login` routes using Supabase Auth. On first signup, create the matching `profiles` row. Route protection: any page other than landing/signup/login redirects to `/login` when there's no session.
* Done when: A new account can be created, logged out of, and logged back into, and an unauthenticated visit to `/history` or `/scan` correctly redirects to `/login`.
* Depends on: Unit 2.

## Unit 4: First Verified Dish
* Scope: Hand-research and enter the ingredient/allergen data for one dish (candidate: egusi soup) into `dish_cache` and `dish_ingredients`, cross-checked against real recipe sources. Set `verified: true` only after this check.
* Done when: The data has a tier and allergen category for every ingredient row, and at least one "sometimes" tier ingredient exists to demonstrate the household-variation story.
* Depends on: Unit 2.

## Unit 5: AI Client Wrappers
* Scope: `lib/ai/identifyDish.ts` (or equivalent), a single function that calls Gemini, and on a rate-limit or error, retries against Groq. Callers never see which provider answered, only the result and a `source` field.
* Done when: Manually forcing a Gemini failure (e.g. a bad key) correctly falls through to Groq and still returns a result.
* Depends on: Unit 1.

## Unit 6: Scan Endpoint
* Scope: `POST /api/scan`. Accepts an image, checks `dish_cache` first, falls back to Unit 5's wrapper on a cache miss, returns dish name, ingredients, and `source`. Writes a `scans` row for the authenticated user.
* Done when: A photo of the Unit 4 dish returns `source: "cache"` with the correct verified data and a `scans` row appears for that user; a photo of anything else returns `source: "llm_fallback"`.
* Depends on: Unit 2, Unit 3, Unit 4, Unit 5.

## Unit 7: Match Endpoint
* Scope: `POST /api/match`. Pure function: dish ingredients plus a user's allergy profile in, tiered flags out. No external API calls.
* Done when: Given the Unit 4 dish and a profile with a matching allergen, returns the correct flags at the correct tiers.
* Depends on: Unit 4.

## Unit 8: Ask-Cook Endpoint
* Scope: `POST /api/ask-cook`. Flagged ingredients in, one plain-language question per flag out.
* Done when: Every flag from Unit 7 produces exactly one clear question, no flag is silently dropped.
* Depends on: Unit 7.

## Unit 9: History Endpoints
* Scope: `GET /api/history` (list, most recent first, scoped to `auth.uid()`), `DELETE /api/history/:id` (owner-only).
* Done when: A user sees only their own scans, in the right order, and deleting one removes it without affecting other users' rows.
* Depends on: Unit 6.

## Unit 10: Home and Profile Pages (Frontend)
* Scope: `/` (post-login home, primary "scan a dish" action) and `/profile` (manage the user's allergen list, reads/writes `allergy_profiles`).
* Done when: A logged-in user can add or remove an allergen and it's reflected on the next scan's matching.
* Depends on: Unit 3, Unit 7.

## Unit 11: Photo Capture and Results (Frontend)
* Scope: `/scan` route. `PhotoCapture` component (single primary action, take or upload), then `ResultCard`, `AllergenFlag`, `AskCookQuestion` components. Dish name and source label (Verified/Estimated) at top, flags grouped by tier, one question per flag, a visible non-alarming disclaimer line.
* Done when: The full flow, photo in to questions out, works end to end for the Unit 4 dish, and the safety-language checklist in `5-ai-workflow-rules.md` passes on every string shown.
* Depends on: Unit 6, Unit 7, Unit 8, Unit 10.

## Unit 12: History Page (Frontend)
* Scope: `/history` route. List of past scans (dish, date, source label, flag summary), tap through to view the full result again.
* Done when: A scan performed in Unit 11 appears in `/history` immediately after, and tapping it shows the same result as the original scan.
* Depends on: Unit 9, Unit 11.

## Unit 13: Design Pass
* Scope: A real visual identity, not default Tailwind gray. Pick a palette and type pairing that fits a food-safety app (calm, trustworthy, not clinical), consistent spacing and motion across all seven pages, a proper empty state for `/history` before a first scan exists, a proper loading state for `/scan` that names what's happening ("Identifying dish...", then "Checking ingredients..."). This is the pass that makes it look like a shipped product, not a hackathon scaffold.
* Done when: Every page shares the same visual language, nothing looks like a placeholder, and the flow feels intentional end to end on a phone screen.
* Depends on: Unit 3, Unit 10, Unit 11, Unit 12.

## Unit 14: Expand Verified Dishes
* Scope: Repeat Unit 4 for 2-4 more dishes (candidates: jollof rice, moin moin), same hand-verification standard.
* Done when: 3-5 total dishes are `verified: true` with real, checked data.
* Depends on: Unit 4, Unit 13 (so the full flow and its design are already proven on one dish before scaling data entry).

## Unit 15: Safety and Security Pass
* Scope: Grep the full codebase and every AI prompt template for "safe," "does not contain," "guaranteed," and any numeric certainty claim, remove or rewrite any that slipped in. Confirm no API key reaches client-side code. Confirm RLS policies actually block cross-user access, don't just trust that they're enabled.
* Done when: Every checklist item in `5-ai-workflow-rules.md` passes across all cached dishes.
* Depends on: Unit 13, Unit 14.

## Unit 16: Deploy and Documentation
* Scope: Deploy to Vercel (Hobby tier). Finish `API.md` with every endpoint's request/response shape and manual test steps.
* Done when: The deployed link works end to end on a phone, from signup through scan through history, and a reviewer could exercise the whole flow from `API.md` alone.
* Depends on: Unit 15.

## Unit 17: Ingredient and Nutrition View
* Scope: Display each scan's possible ingredients grouped by tier, add qualitative nutrition cues without unsupported numeric calorie/macro estimates, persist ingredients for scan history with an additive migration, and shift the shared visual palette to blue.
* Done when: A scan and its history entry show the tiered ingredient list and cautious nutrition guidance; no exact calories or macro grams are fabricated; existing allergy questions and Verified/Estimated labels remain visible; all routes use the blue palette.
* Depends on: Units 6, 9, 11, 12, and 13.
