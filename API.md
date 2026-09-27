# PetitScan API

The current demo uses an in-memory verified dish catalog so it runs without credentials. Production wiring should use the Supabase tables in `supabase/migrations/202609270001_initial_schema.sql` and the server-only variables in `.env.example`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` to client components or `NEXT_PUBLIC_*` variables.

## `POST /api/scan`
Multipart form data: `image` (file), optional `dish` (demo dish name). Returns `{ dishName, source, ingredients }`, where `source` is `cache` or `llm_fallback`.

## `POST /api/match`
JSON body: `{ ingredients: DishIngredient[], allergens: string[] }`. Returns `{ flags: Flag[] }`. This endpoint makes no external calls.

## `POST /api/ask-cook`
JSON body: `{ flags: { ingredient, tier }[] }`. Returns `{ questions: { ingredient, question }[] }`, one question for each input flag.

## Manual test
Run `npm install`, then `npm run dev`. Upload a photo, select a profile, and scan one of the three demo dishes. Confirm the result has a visible `Verified` label, tiered flags, and an “Ask the cook” question for every flag. Selecting “Something else” demonstrates the visible `Estimated` path.
