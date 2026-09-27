# Code Standards

## TypeScript Conventions
* Strict mode: `"strict": true`.
* Avoid `any`. Use `unknown` for genuinely dynamic shapes (e.g. raw LLM output), then narrow.
* `interface` for object models, `type` for unions and aliases.

## Next.js Structure
* `app/api/*`: route handlers. HTTP parsing, response formatting, error catching. No business logic here.
* `lib/services/*`: pure business logic (dish matching, tier calculation, question generation). Keep isolated and testable, no direct HTTP concerns.
* `lib/ai/*`: Gemini and Groq client wrappers, including the fallback-on-rate-limit logic. Callers use one function (e.g. `identifyDish(image)`), they don't know or care which provider answered.
* `components/*`: named by what they render, not by generic role. `PhotoCapture`, `ProfileSwitcher`, `ResultCard`, `AllergenFlag`, `AskCookQuestion`. No generic `Card` or `Container` components that hide what's actually on screen.
* Tailwind only. No separate CSS files, no component library beyond what Tailwind provides directly.

## Data and Migration Rules
* Build exactly the models defined in `2-architecture.md`: `users`, `allergy_profiles`, `dish_cache`, `dish_ingredients`, `scans`.
* Migrations are additive only. Never delete or destroy existing data, never modify a migration once it has been applied.
* Seed data for `dish_cache` goes through manual review before `verified` is set to `true`, this is not something a script or an LLM call sets on its own.

## Git and Secrets
* Never commit `.env` files, Supabase keys, Gemini/Groq keys, or archives.
* Environment variables are set only in the Vercel dashboard, never in Git.
* Before every push: `git diff --check`, `git status --short`, and the relevant build or test.

## Documentation Workflow
* Document every endpoint, request/response shape, and migration in `API.md` as it's built.
* If `2-architecture.md` and the actual implementation diverge, flag it for an update in the same session, don't let the doc go stale.
