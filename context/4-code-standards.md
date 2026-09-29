# Code Standards

## TypeScript Conventions
* Strict mode: `"strict": true`.
* Avoid `any`. Use `unknown` for genuinely dynamic shapes (e.g. raw vision-model output), then narrow with a validator before use. Do not add a new dependency for this in the last days of the build; use zod only if it is already installed.
* `interface` for object models, `type` for unions and aliases.
* Ranges are a shared type, `Range { low: number; high: number }`, and carbohydrate values are never passed around as a bare number.

## Next.js Structure
* `app/api/*`: route handlers. HTTP parsing, auth check, response formatting, error catching. No business logic here.
* `lib/services/*`: pure business logic, isolated and testable, no HTTP concerns. Expected modules: `nutrition.ts` (food + preparation + portion to range), `confidence.ts`, `sugarSpoon.ts`, `mealImpact.ts`, `buffer.ts`.
* `lib/ai/*`: Gemini and Groq client wrappers, including the fallback-on-rate-limit logic. Callers use one function (`identifyMeal(image)`), they don't know or care which provider answered. Prompt templates live here and must never ask the model for nutrition numbers.
* `lib/config/*`: tunable numbers in one place, each with a comment stating its basis: ask-thresholds per step, Meal Impact thresholds and modifiers, grams per spoon.
* `lib/constants/language.ts`: `DISCLAIMER_TEXT` and the approved labels from `3-ui-context.md`. UI code imports these; it does not retype them.
* `components/*`: named by what they render, not by generic role. `PhotoCapture`, `ClarifyPrompt`, `PortionPicker`, `PreparationPicker`, `MealPreparedPrompt`, `MealImpactCard`, `SugarSpoonMeter`, `ConfidenceBreakdown`, `BufferActions`, `EstimateDisclaimer`, `ScanHistoryItem`. No generic `Card` or `Container` components that hide what's actually on screen.
* Tailwind only. No separate CSS files, no component library beyond what Tailwind provides directly. Reuse the existing shared visual tokens (ice blue, cobalt, navy).

## Data and Migration Rules
* Build exactly the models defined in `2-architecture.md`: `profiles`, `foods`, `food_nutrition`, `scans` (new columns), `scan_corrections`. `dish_cache`, `dish_ingredients`, and `allergy_profiles` are legacy: leave them in place and do not reference them.
* Migrations are additive only. Never delete or destroy existing data, never drop a column or table, never modify a migration once it has been applied. Relaxing a legacy NOT NULL constraint is allowed when it blocks new inserts.
* Seed data for `foods` and `food_nutrition` goes through manual review before `verified` is set to `true`. Every `food_nutrition` row must have a `source_note`, and a `gi_source` whenever `gi_category` is set. This is not something a script or an LLM call sets on its own, and no range is ever invented to fill a gap.
* Corrections in `scan_corrections` are never promoted into `foods` or `food_nutrition` by code.

## Numbers and Formatting
* One formatting helper renders ranges (`X–Y g`, `X–Y spoons`). Nothing formats a carbohydrate value any other way.
* Spoon conversion and impact thresholds are read from `lib/config`, never hard-coded in a component or route.
* Pure services get tests using fixtures for the two demo plates. If no test runner exists, use a plain `tsx` script that asserts against fixtures rather than adding a framework.

## Git and Secrets
* Never commit `.env` files, Supabase keys, Gemini/Groq keys, or archives.
* Environment variables are set only in the Vercel dashboard, never in Git.
* Before every push: `git diff --check`, `git status --short`, and the relevant build or test. The full production build has previously not finished in the resource-constrained workspace, so run a standalone TypeScript check (`tsc --noEmit`) plus the specific tests for the unit, and do the full build on the deploy.

## Documentation Workflow
* Document every endpoint, request/response shape, and migration in `API.md` as it's built. Remove the retired `/api/match` and `/api/ask-cook` entries in the same session the routes are removed.
* Document the Confidence Engine combination rule and the Meal Impact thresholds and modifiers in `API.md`, with the basis for each.
* If `2-architecture.md` and the actual implementation diverge, flag it for an update in the same session, don't let the doc go stale.
* Keep `.codexrules` consistent with these files. It predates the pivot, so check it for allergen-era rules and the old product name.
