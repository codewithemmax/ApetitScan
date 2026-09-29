# ApetitScan API

Unit 1 freezes the legacy database and retires the allergen-era API surface. No database tables or migrations were modified.

## Current authenticated plumbing

- GET /api/history returns the authenticated user's existing scan rows in reverse chronological order.
- DELETE /api/history/:id deletes only the authenticated user's scan row.
- POST /api/scan accepts an authenticated meal photo and returns identified components, clarification questions, and the saved scan ID.

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

## Unit 7 `POST /api/scan`

The route requires a signed-in Supabase user and accepts `multipart/form-data` with an `image` field containing a JPEG, PNG, or WebP photo up to 8 MiB. It queries the verified food catalogue and its seeded preparations, identifies the photo through `identifyMeal`, and matches names exactly to the catalogue (no fuzzy nutrition lookup). Unmatched or low-confidence foods generate a food or main-carbohydrate question; portion and preparation questions are created when the model score is below 70, the model returns `uncertain`, or there is no matching seeded preparation. The 70% cutoff is a product heuristic, not a clinical validation threshold.

On success it inserts an owner-scoped `scans` row with `components` and `status`; `status` is `needs_input` when there are questions, otherwise `complete`. Components carry IDs, catalogue match/category, food/portion/preparation guesses, per-step confidence, and confirmation flags. The route does not return or store nutrition values or retain the uploaded photo (`image_url` is null). Response: `{ scan_id, status, components, questions }`, where each question has `component_id`, `step`, `prompt`, and seeded `options`. Unidentified empty model output becomes an `unidentified food` placeholder and asks for the main carbohydrate. Authentication failure returns 401, invalid/unsupported/oversized uploads return 400/415/413, provider failure returns 502 (missing server keys returns 503), and catalogue or scan persistence failures return 503/500 respectively. The verified-food cutoff lives in `lib/services/nutritionConfig.ts`.

Manual acceptance checks: submit both demo photos as an authenticated user and inspect their questions and saved scan rows; submit a photo the model cannot identify and confirm it asks for the main carbohydrate; force each confidence step below 70 and confirm its corresponding question; submit unauthenticated and confirm no scan row is inserted.

## Unit 8 `POST /api/estimate`

The route requires authentication and accepts JSON in this shape:

```json
{
  "scan_id": "<scan UUID>",
  "components": [{
    "component_id": "<ID returned by /api/scan>",
    "food": "white rice",
    "food_confirmed": true,
    "portion": "medium",
    "portion_confirmed": true,
    "preparation": "boiled",
    "preparation_confirmed": true
  }]
}
```

The component IDs must exactly match the owner’s saved scan; client-supplied nutrition values are ignored/not accepted. Foods must exactly match a verified catalogue record. The route reads that food’s verified `food_nutrition` rows, runs the pure Unit 5-6 functions, and updates only the owner’s scan. A missing/unverified row returns `status: needs_input`, a clarification question, and no carbohydrate, spoon, or impact values. When portion/preparation remains unconfirmed but a supported range can be formed, the estimate includes the widened range, disclosed assumptions, and questions; its status stays `needs_input` until clarified.

Successful estimates return `{ scan_id, status, components, total_carbs_g, sugar_spoons, meal_impact, confidence, drivers, assumptions, questions, range_straddles_band, boundary_note, disclaimer }`. `components` include each carbohydrate range and verified source note. All responses containing estimate values include the exact disclaimer. Errors: 401 unauthenticated, 400 invalid request/component set, 404 scan not found or not owned, 409 no identified scan components, 503 catalogue read failure, and 500 persistence failure. Manual acceptance: try both demo plates, verify ranges trace to seeded rows and both receive the disclaimer, test a missing verified row returns no number, and confirm one user cannot estimate another user's scan.

## Unit 9 `POST /api/buffer`

Requires authentication. Request: `{ "scan_id": "<scan UUID>", "meal_prepared": true }`. The scan must belong to the caller and have a complete estimate. The response is `{ scan_id, meal_prepared, actions }`; each action has a feasibility `rank`, `group` (`Prepare`, `Adjust`, or `Recover`), `title`, and `description`. Actions are saved to the owner’s scan together with `meal_prepared`. When the meal is already prepared, Prepare actions are omitted; suggestions are to serve a smaller rice portion where applicable, add vegetables or protein if available, consider light activity after eating, and keep the meal in mind next time. Suggestions make no numeric or guaranteed effect claim. Errors include 401 unauthenticated, 400 invalid request, 404 missing/not-owned scan, 409 estimate not complete, and 500 persistence failure.

## Unit 9 `POST /api/correct`

Requires authentication. Request:

```json
{
  "scan_id": "<scan UUID>",
  "component_id": "<ID returned by /api/scan>",
  "step": "portion",
  "corrected": "large"
}
```

`step` is `food`, `main_carbohydrate`, `portion`, or `preparation`; `corrected` is a verified catalogue food name, a supported main-carbohydrate name, `small` / `medium` / `large`, or an available preparation label, respectively. The route verifies scan ownership and component membership, writes an owner-scoped `scan_corrections` audit row, applies the correction only to that scan, then recomputes from verified `food_nutrition` rows using the same shared calculation as `/api/estimate`. It never writes to `foods` or `food_nutrition`. The response contains the correction ID, updated components/status, and, when available, recalculated ranges, confidence, impact, assumptions, questions, and disclaimer. If the correction leaves an unsupported or ambiguous nutrition input, the estimate is cleared and the response asks for clarification rather than inventing a value. Errors include 401 unauthenticated, 400 invalid/unsupported correction, 404 missing/not-owned scan, 503 verified catalogue read failure, and 500 persistence failure.

Manual acceptance for Unit 9: on Plate 1 request Buffer with `meal_prepared: true`, confirm only Adjust/Recover groups appear; correct the rice portion and confirm the saved scan's range is recomputed and a `scan_corrections` row is created; confirm another user cannot correct the scan. Both endpoints use authenticated owner-scoped queries and Unit 2 database RLS policies.

## Unit 10 `GET /api/history`

Requires authentication. Returns `{ scans, disclaimer }`; scans are the caller’s rows, most-recent-first, shaped as `{ id, status, meal_impact, total_carbs_g, sugar_spoons, created_at }`. `total_carbs_g` and `sugar_spoons` are `{ low, high }` ranges, or `null` when an older PetitScan row has no ApetitScan estimate (or when stored bounds are incomplete/invalid). No single carbohydrate value is returned. The exact estimate disclaimer accompanies the response because history includes Meal Impact and Sugar Spoon values. The query explicitly filters by the authenticated user and the existing scans RLS policy independently enforces ownership. Errors: 401 unauthenticated, 500 history read failure.

## Unit 10 `DELETE /api/history/:id`

Requires authentication. Deletes only the caller’s scan, and the database RLS policy remains the enforcement boundary. Returns `{ deleted: true, id }` on success, 404 when the scan is missing or not owned by the caller, 401 unauthenticated, and 500 on database failure. Deleting a scan also removes its corrections through the existing foreign-key cascade.

Manual acceptance for Unit 10: verify newest-first ordering and the range fields for a new estimate; confirm an older legacy row remains in the response with null estimate ranges; confirm one user cannot see another user’s scan; delete one owned scan and confirm it disappears without affecting another user’s row.
