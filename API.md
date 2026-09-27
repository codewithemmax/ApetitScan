# PetitScan API

The current demo uses an in-memory verified dish catalog so it runs without credentials. Production wiring should use the Supabase tables in `supabase/migrations/202609270001_initial_schema.sql` and the server-only variables in `.env.example`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` to client components or `NEXT_PUBLIC_*` variables.

## Database migration

`supabase/migrations/202609270002_profiles_auth_rls.sql` adds the Auth-backed `profiles` table, adds persisted `flags` to scans, moves the legacy ownership foreign keys to `auth.users`, and enables owner-scoped RLS policies. The original migration is intentionally unchanged.

## Unit 3 authentication

`/signup` creates a Supabase email/password account and a matching `profiles` row when a session is immediately available. If email confirmation is enabled, `/auth/callback` exchanges the confirmation code and creates the profile row. `/login` signs users in. Middleware protects `/home`, `/scan`, `/history`, and `/profile`, redirecting unauthenticated visitors to `/login`.

## Unit 4 verified dish

`supabase/migrations/202609270003_seed_egusi_soup.sql` adds the first hand-reviewed `dish_cache` record: Egusi soup. Its ingredient tiers and shellfish variation were cross-checked against [Koki Afrique](https://kokiafrique.com/en/dishes/egusi-soup/), [Food Network Kitchen](https://www.foodnetwork.com/recipes/food-network-kitchen/egusi-stew-12347892), [My Nigerian Food](https://mynigerianfood.co.uk/nigerian-recipes/nigerian-soups/egusi-soup), and [Boston Medical Center](https://www.bmc.org/recipes/egusi-soup). The seed is idempotent and does not write any LLM output.

## Unit 5 AI wrapper

`lib/ai/identifyDish.ts` exposes `identifyDish(image)`. It calls Gemini first using the server-only `GEMINI_API_KEY`; any provider error or invalid response triggers the same request shape against Groq using `GROQ_API_KEY`. The caller receives structured ingredients and `source: "llm_fallback"`; provider keys never enter client code. Set `GEMINI_MODEL` and `GROQ_MODEL` in `.env.local` to override the defaults.

## Unit 6 scan endpoint

`POST /api/scan` requires a Supabase Auth session and multipart `image`. An optional `dish` field is used by the verified demo flow to look up `dish_cache`; only `verified = true` rows are eligible for a cache hit. Cache hits skip both AI providers. Cache misses call `identifyDish`, return `source: "llm_fallback"`, and never write the result into `dish_cache`. Every successful scan inserts an owned `scans` row. The `flags` value is initialized as an empty JSON array until Unit 7 matching supplies the user-specific flags.

## `POST /api/scan`
Multipart form data: `image` (file), optional `dish` (demo dish name). Returns `{ dishName, source, ingredients }`, where `source` is `cache` or `llm_fallback`.

## `POST /api/match`
JSON body: `{ ingredients: DishIngredient[], allergens: string[] }`. Returns `{ flags: Flag[] }`. This endpoint makes no external calls.

## `POST /api/ask-cook`
JSON body: `{ flags: { ingredient, tier }[] }`. Returns `{ questions: { ingredient, question }[] }`, one question for each input flag.

## Manual test
Run `npm install`, then `npm run dev`. Upload a photo, select a profile, and scan one of the three demo dishes. Confirm the result has a visible `Verified` label, tiered flags, and an “Ask the cook” question for every flag. Selecting “Something else” demonstrates the visible `Estimated` path.
