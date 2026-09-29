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

## Unit 3 demo food data

`supabase/migrations/202609290002_apetitscan_demo_food_data.sql` seeds white rice, plantain, tomato stew, chicken, vegetables, and fish for the two demo plates. It has Small, Medium, and Large rows for boiled rice; boiled and fried plantain; cooked tomato stew; boiled and grilled chicken; boiled vegetables; and steamed and grilled fish. Each nutrition row carries its source note and entry confidence. The carbohydrate ranges are scaled from cited per-100 g values using the serving bands described in those notes.

The plantain entries use Nigerian table values of 18.4 g/100 g boiled and 48.0 g/100 g fried. Plain chicken and catfish entries use zero carbohydrate; sauce and coating are not included. The `vegetables` entry uses boiled amaranth leaves as a leafy-green proxy and should be disclosed or queried when the identified vegetable differs. Tomato stew uses one measured Nigerian recipe and can vary by household. GI fields remain null because no suitable source was verified for the exact seeded food/preparation pairs. The user reports applying the seed migration in Supabase; row-level verification is pending.

## Unit 4 meal identification

`identifyMeal({ base64, mimeType })` in `lib/ai/identifyMeal.ts` is a server-side vision wrapper. It accepts JPEG, PNG, or WebP image data, calls the configured Gemini model first, and retries with Groq after any request, response, or validation failure. Provider identity is not included in successful results. Both providers receive the image and an identification-only prompt; the prompt explicitly excludes nutrition values.

The returned shape is `{ components: [{ food, portion, preparation, confidence: { food, portion, preparation } }] }`. Portion is `small`, `medium`, `large`, or `uncertain`; preparation is a short label or `uncertain`; each confidence is an integer from 0 to 100. The response is validated from `unknown`, and empty, malformed, or out-of-contract output raises a clear error rather than returning partial data. Provider calls have a 30-second timeout. Configure `GEMINI_API_KEY`, `GROQ_API_KEY`, and optionally `GEMINI_MODEL` / `GROQ_MODEL` in server-only environment variables. Manual acceptance checks: scan both demo-plate photos; temporarily use an invalid Gemini key and confirm Groq succeeds; then make both provider outputs malformed and confirm the function returns a clear failure.

## Unit 5 nutrition and Sugar Spoon functions

`calculateNutrition(components, entries)` in `lib/services/nutrition.ts` is pure. `entries` are `food_nutrition` rows joined to `foods(name, verified)` and are eligible only when `verified` is true, the range is valid, and `source_note` is present. It returns per-component `carbs_g` ranges, a total range only when every component resolves, source notes, `entry_confidence`, assumptions, and explicit clarification questions. Missing/unverified food or preparation data yields `carbs_g: null` for that component and no total; it never fills a gap with a model estimate.

When portion is unconfirmed, the engine widens to adjacent seeded portion tiers (or all tiers when portion is `uncertain`) and asks the user to confirm. An unconfirmed model preparation guess is disclosed and remains correctable. If there is only one seeded preparation and no guess, it uses that preparation as an explicit assumption; where multiple choices remain it asks instead of choosing one. `toSugarSpoonRange(range)` in `lib/services/sugarSpoon.ts` converts the carbohydrate range using the proposed default of 4 g per spoon and rounds outward to one decimal. `formatRange(range, unit)` is the shared range formatter. `DISCLAIMER_TEXT` is exported with the nutrition config until the expected `lib/constants` directory can be created in this workspace.

## Unit 6 confidence and Meal Impact

`calculateConfidence(components)` in `lib/services/confidence.ts` clamps input scores to 0–100 and validates each non-negative carbohydrate range (`high >= low`). For each meal it uses the minimum food/preparation confidence for `vision`; `portion` is 100 for a user-confirmed portion or the model portion confidence otherwise; `nutrition` is the minimum of the row's `entry_confidence` and `(carbs_low_g / carbs_high_g) * 100`. For a `0–0 g` range, nutrition confidence is the row's `entry_confidence`. `overall` is the minimum of `vision`, `portion`, and `nutrition`.

`calculateMealImpact(range, components)` in `lib/services/mealImpact.ts` classifies the carbohydrate-range midpoint only: below 50 g is `low`, 50 through 100 g is `moderate`, and above 100 g is `high`. Vegetables, protein, and identified preparations are returned as explanatory `drivers`; they do not modify the band. A range that crosses either threshold sets `range_straddles_band` and includes a `boundary_note`. The range-width term in nutrition confidence reflects estimate spread; there is no additional undocumented boundary penalty. Thresholds are user-approved prototype rules, not clinical cutoffs. Both functions are pure and make no provider or database calls.
