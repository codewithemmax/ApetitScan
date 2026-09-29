# Implementation Units

Each unit is one atomic step: small enough to build, test, and commit on its own. Build in order. Do not start a unit until the previous one is done and verified against `5-ai-workflow-rules.md`.

The deadline is September 30, 2026, so this list is short and reuses what PetitScan already built (Supabase Auth, route protection, history plumbing, Gemini/Groq fallback, blue design tokens). Numbering restarts for ApetitScan; the old PetitScan units are retired.

## Cut Line (If Time Runs Out)
Protect first: Units 1-3 and 5-9 and 11, which give the two demo plates end to end with ranges, disclaimer, questions, correction, and Buffer Engine. Cut in this order: extra foods (stretch), history polish, profile page extras, design polish (Unit 12). Never cut: ranges, the on-screen disclaimer, ask-instead-of-guess, the correction flow, verified data for both plates.

## Unit 1: Pivot Audit and Legacy Freeze
* Scope: Audit the repo against these context files and report the gap list first: what exists (auth pages, history, provider wrapper, tokens) versus what is missing. Then retire the allergen UI, the `/api/match` and `/api/ask-cook` routes, and allergen-era copy, and rename PetitScan to ApetitScan in UI strings, metadata, package name, README, and `.codexrules`. Do not touch database tables.
* Done when: The gap list is reported, no allergen screen or route is reachable, the app name reads ApetitScan everywhere, and a standalone type check passes.
* Depends on: none.

## Unit 2: Schema Migration and Row Level Security
* Scope: One new additive migration creating `foods`, `food_nutrition`, and `scan_corrections`, adding the new `scans` columns from `2-architecture.md`, relaxing any legacy NOT NULL constraint that blocks new inserts, and adding RLS on `scans` and `scan_corrections` scoped to `auth.uid()`. Legacy tables and columns stay.
* Done when: The migration applies cleanly, foreign keys and the `food_nutrition` uniqueness constraint are enforced, and a manual test confirms one user cannot read or delete another user's `scans` or `scan_corrections` rows.
* Depends on: Unit 1.

## Unit 3: Verified Food Data for the Demo Plates
* Scope: Hand-research and enter `foods` and `food_nutrition` rows for every component of both demo plates: white rice, plantain (fried and boiled), tomato stew, chicken, vegetables, fish. Cover small, medium, and large for each preparation used. Every row needs a `source_note` and an `entry_confidence`; set `gi_category` only with a `gi_source`. Set `verified: true` only after checking. Non-carb components get rows too.
* Done when: Both plates resolve fully with no missing rows, every row has a source, and at least one preparation choice (fried vs boiled plantain) shows a real difference in data.
* Depends on: Unit 2.

## Unit 4: Vision Wrapper
* Scope: `lib/ai/identifyMeal.ts`, a single function that calls Gemini and, on a rate-limit or error, retries against Groq. It returns components with food, portion guess, preparation guess, and per-step confidence, validated from `unknown`. The prompt asks for identification only and never for nutrition numbers. Callers never see which provider answered.
* Done when: A photo of each demo plate returns the expected components, forcing a Gemini failure (a bad key) falls through to Groq, and a malformed response produces a clear error.
* Depends on: Unit 1.

## Unit 5: Nutrition Engine and Sugar Spoon Index
* Scope: `lib/services/nutrition.ts` and `sugarSpoon.ts`, plus `lib/config` values. Pure functions: confirmed components in, per-component and total carbohydrate ranges out, then the spoon range. Handles unconfirmed portion (widen the range) and unconfirmed preparation (disclose the assumption). Returns no number for a food with no verified row. Tests use the demo-plate fixtures.
* Done when: Both plates produce sensible ranges, the range widens when portion is left unconfirmed, and a food with no row returns no number and a clear "ask" signal.
* Depends on: Unit 3.

## Unit 6: Confidence Engine and Meal Impact
* Scope: `lib/services/confidence.ts` and `mealImpact.ts`. Confidence Engine scores vision, portion, and nutrition separately and combines them (overall equals the lowest). Meal Impact returns Low / Moderate / High plus `drivers`, with thresholds and modifiers in `lib/config`, each with a documented basis. Straddling a band boundary lowers confidence and is flagged. Tests use the demo-plate fixtures.
* Done when: Plate 1 returns High and plate 2 returns a clearly lower band, the drivers explain why, and an uncertain input lowers the confidence percentage.
* Depends on: Unit 5.

## Unit 7: Scan Endpoint
* Scope: `POST /api/scan`. Accepts an image, calls Unit 4's wrapper, builds the `questions` list for anything below its ask-threshold (portion chips, preparation choice, or "name the main carbohydrate" for an unidentified dish), and writes a `scans` row for the authenticated user with the right `status`.
* Done when: Each demo plate returns its components with the expected questions, an unidentifiable photo asks for the main carbohydrate, and a `scans` row appears for that user.
* Depends on: Unit 2, Unit 4, Unit 6.

## Unit 8: Estimate Endpoint
* Scope: `POST /api/estimate`. Confirmed components in, full estimate out per the response contract in `2-architecture.md` (ranges, spoons, impact, confidence breakdown, drivers, assumptions, disclaimer). Updates the scan row.
* Done when: Both demo plates return the documented shape, every response includes `disclaimer`, and no single-number carbohydrate value appears.
* Depends on: Unit 5, Unit 6, Unit 7.

## Unit 9: Buffer and Correction Endpoints
* Scope: `POST /api/buffer` (takes `meal_prepared`, returns ranked Prepare / Adjust / Recover actions per the feasibility order, with Prepare actions removed when the meal is prepared) and `POST /api/correct` (stores a row in `scan_corrections` for the owner, applies it to that scan, and recomputes the estimate). Corrections never touch `foods` or `food_nutrition`.
* Done when: Plate 1 with `meal_prepared: true` returns Adjust actions (reduce rice, add vegetables or protein) and no "replace" wording, a correction changes the recomputed estimate, and the correction row exists and is owner-scoped.
* Depends on: Unit 8.

## Unit 10: History Endpoints
* Scope: Update `GET /api/history` (most recent first, scoped to `auth.uid()`) to return impact, carbohydrate range, spoon range, and timestamp, and confirm `DELETE /api/history/:id` (owner-only) still works with the new columns.
* Done when: A user sees only their own scans in the right order, older PetitScan rows do not break the response, and deleting one scan does not affect other users' rows.
* Depends on: Unit 8.

## Unit 11: Scan Flow (Frontend)
* Scope: `/scan`. `PhotoCapture` (single primary action, take or upload), `ClarifyPrompt` with `PortionPicker` and `PreparationPicker` for each open question, `MealPreparedPrompt`, `MealImpactCard` with `SugarSpoonMeter`, `ConfidenceBreakdown`, and `EstimateDisclaimer` in the same card, and `BufferActions`. Loading states that name what is happening ("Identifying foods...", then "Estimating carbohydrates..."). Every assumption is shown and changeable.
* Done when: The full flow, photo in to Buffer actions out, works on both demo plates on a phone screen, the disclaimer is visible without any tap, ranges are the only carbohydrate format shown, and the checklist in `5-ai-workflow-rules.md` passes on every string.
* Depends on: Unit 7, Unit 8, Unit 9.

## Unit 12: Home, History, Profile, and Design Pass (Frontend)
* Scope: `/` with the primary "scan a meal" action, `/history` showing each scan's date, impact, and spoon range (with an empty state before the first scan) and tap-through to the full saved result, `/profile` with display name and sign out. Apply the existing blue visual system consistently, with no placeholder-looking screens.
* Done when: Every page shares one visual language, a scan from Unit 11 appears in `/history` immediately and reopens to the same result, and the flow feels intentional end to end on a phone.
* Depends on: Unit 10, Unit 11.

## Unit 13: Safety and Credibility Pass
* Scope: Run the grep list from `3-ui-context.md` across the codebase, every prompt template, and every user-facing string, and fix any hit. Confirm no API key reaches client-side code. Test that RLS actually blocks cross-user access. Confirm the demo does not surface anything from the "Explicitly Do Not Build" list.
* Done when: Every item in the verification checklist in `5-ai-workflow-rules.md` passes across both demo plates.
* Depends on: Unit 12.

## Unit 14: Deploy, Documentation, and Demo Rehearsal
* Scope: Deploy to Vercel (Hobby tier). Finish `API.md` with every endpoint's request/response shape, the engine rules and thresholds with their basis, and manual test steps. Rehearse the demo script on a phone using both real plates, in order, and record a backup screen capture in case a provider rate-limits during judging. Prepare pitch points for Phase 1, Phase 2, and the moat, leaving Phase 3 out.
* Done when: The deployed link works end to end on a phone from signup through scan, correction, Buffer, and history; a reviewer could exercise the flow from `API.md` alone; and the backup recording exists.
* Depends on: Unit 13.

## Stretch (Only After Unit 14)
* Add more verified staples (candidates, confirm: jollof rice, eba or garri, yam, beans, moin moin), same hand-verification standard.
* Count-based pattern note from history ("you've scanned rice-heavy meals three times this week"), with no health claims.
