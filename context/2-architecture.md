# Architecture

## Tech Stack
| Layer | Technology | Role |
| :--- | :--- | :--- |
| Frontend | Next.js (App Router), Tailwind CSS | Profile switcher, photo capture, results screen. |
| Backend | Next.js API routes | No separate Express server. One repo, one deploy. |
| Database | Supabase (Postgres) | Users, allergy profiles, dish cache, scan history. |
| Vision + reasoning, primary | Gemini API (Google AI Studio key) | Free tier, no billing account. Dish identification and ingredient reasoning in one call. |
| Vision + reasoning, fallback | Groq (free tier, OpenAI-SDK compatible) | Used only when Gemini's free-tier rate limit is hit. Same request shape, swap base URL and key. |
| Hosting | Vercel, Hobby tier | Free, pairs directly with Next.js. |

Everything above is zero-dollar. No card on file anywhere in this stack.

## Repository and Branches
* Repository: TBD, fill in once created.
* `main`: stable branch.
* Feature branches per unit from `7-units.md`, e.g. `feat/dish-cache-schema`, `feat/scan-endpoint`.
* Open a PR into `main` per unit, even solo, keeps the history reviewable and matches the working style in `.codexrules`.

## Data Model (Required)

**users**
* id (uuid, pk)
* name
* created_at

**allergy_profiles**
* id (uuid, pk)
* user_id (fk -> users.id)
* allergen (text: e.g. "peanut", "shellfish", "dairy", "egg", "gluten")

**dish_cache**
* id (uuid, pk)
* dish_name (text, unique)
* verified (boolean) — true only once hand-checked against real recipes

**dish_ingredients**
* id (uuid, pk)
* dish_cache_id (fk -> dish_cache.id)
* ingredient (text)
* tier (text: "always" | "commonly" | "sometimes")
* allergen_category (text, maps to allergy_profiles.allergen)
* regional_note (text, nullable)

**scans**
* id (uuid, pk)
* user_id (fk -> users.id)
* image_url (text)
* matched_dish (text, nullable)
* source (text: "cache" | "llm_fallback")
* created_at

## Required Endpoints
* `POST /api/scan` — image in, dish identification and ingredients out, `source` field set.
* `POST /api/match` — dish ingredients plus a user's allergy profile in, tiered flags out. Pure function, no external calls.
* `POST /api/ask-cook` — flagged ingredients in, one plain-language question per flag out.

## Auth / Access Model
* No full authentication for the hackathon build. A fixed local list of demo profiles the user switches between.
* If real auth is added post-hackathon, it follows the Supabase JWT pattern: owner endpoints validate ownership against the authenticated user.

## AI / Background Task Model
* `POST /api/scan` calls Gemini first. On a rate-limit or error response, retries the same request against Groq before failing.
* A cache hit skips both external calls entirely, dish and ingredients come straight from `dish_cache` / `dish_ingredients`.
* A cache miss triggers the LLM fallback, tagged `source: "llm_fallback"` in the response and in the `scans` row. This output is never auto-written back into `dish_cache`.

## Invariants (Hard Rules)
1. The public-facing response never states or implies a dish "is safe" or "does not contain" an allergen.
2. Every response includes an "ask the cook" question for each flagged allergen.
3. `source` (`cache` or `llm_fallback`) is present on every scan response and rendered visibly by the frontend.
4. `dish_cache` only grows through manual review. LLM fallback output is never written to it automatically.
5. Migrations are additive only. Never delete or destroy existing data.
6. No API keys (Gemini, Groq, Supabase service role) in client-side code, only the two `NEXT_PUBLIC_*` Supabase values are allowed in the browser bundle.
7. Live demo photos come only from `dish_cache` rows with `verified: true`.
