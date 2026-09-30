# Architecture

## Tech Stack
| Layer | Technology | Role |
| :--- | :--- | :--- |
| Frontend | Next.js (App Router), Tailwind CSS | Photo capture, clarifying questions, result screens, history. |
| Backend | Next.js API routes | No separate Express server. One repo, one deploy. |
| Database | Supabase (Postgres) | Users, food data, scans, corrections. |
| Vision, primary | Gemini API (Google AI Studio key) | Free tier, no billing account. Identifies components, portion guess, preparation guess, and per-step confidence. |
| Vision, fallback | Groq (free tier, OpenAI-SDK compatible) | Used only when Gemini's free-tier rate limit is hit or it errors. Same request shape, swap base URL and key. |
| Hosting | Vercel, Hobby tier | Free, pairs directly with Next.js. |

Everything above is zero-dollar. No card on file anywhere in this stack. The stack is unchanged from PetitScan.

## Repository and Branches
* Repository: existing repo, URL TBD.
* `main`: stable branch.
* Feature branches per unit from `7-units.md`, e.g. `feat/food-nutrition-schema`, `feat/estimate-endpoint`.
* Open a PR into `main` per unit, even solo, keeps the history reviewable and matches the working style in `.codexrules`.

## System Pipeline
```
Meal photo
  -> Food ID + Portion + Preparation        (vision model, lib/ai)
  -> Confidence Engine                      (vision / portion / nutrition, scored separately)
  -> Clarifying questions where uncertain   (user confirms or corrects)
  -> Nutrition Engine                       (food + preparation + portion -> carb range, from verified data)
  -> Sugar Spoon Index                      (visual carb-exposure count, not a glucose claim)
  -> Meal Impact Profile                    (Low / Moderate / High + confidence %)
  -> Buffer Engine                          (Prepare / Adjust / Recover)
  -> User correction stored with the scan
```

## Division of Labor (Hard Boundary)
* The vision model identifies. It returns foods, portion, preparation, and confidences. It never returns carbohydrate, calorie, or any nutrition numbers.
* The Nutrition Engine calculates. Every carbohydrate number comes from a verified row in `food_nutrition`. No table row, no number.
* Everything after identification (nutrition, spoons, impact, buffer) is a pure, deterministic function with no external calls.

## Data Model (Required)

**Auth is handled by Supabase's built-in `auth.users` table. No separate `users` table.** `profiles` extends it.

**profiles** (kept from PetitScan)
* id (uuid, pk, matches `auth.users.id`)
* display_name (text)
* created_at

**foods** (new)
* id (uuid, pk)
* name (text, unique, e.g. "white rice", "plantain", "tomato stew", "chicken", "fish", "vegetables")
* category (text: "carb_staple" | "protein" | "vegetable" | "stew_soup" | "other")
* is_main_carb (boolean, used for the "name the main carbohydrate" question)
* verified (boolean), true only once every nutrition row for the food is hand-checked

**food_nutrition** (new, one row per food + preparation + portion)
* id (uuid, pk)
* food_id (fk -> foods.id)
* preparation (text, e.g. "boiled" | "fried" | "steamed"; only values actually seeded)
* portion_size (text: "small" | "medium" | "large")
* carbs_low_g, carbs_high_g (numeric, the carbohydrate range for that portion; non-carb foods still get a row so totals are honest)
* gi_category (text, nullable: "low" | "medium" | "high")
* gi_source (text, nullable, required whenever gi_category is set)
* source_note (text, required: where the range comes from)
* entry_confidence (integer 0-100, how much to trust this row)
* unique (food_id, preparation, portion_size)

**scans** (existing table, new columns added by an additive migration)
* Existing: id, user_id (fk -> auth.users.id, matches `auth.uid()`), image_url, matched_dish, flags, ingredients, source, created_at. The allergen-era columns (`matched_dish`, `flags`, `ingredients`, `source`) stay in place, unused. If a legacy NOT NULL constraint blocks new inserts, relax it in the new migration. Never drop a column.
* New: status (text: "needs_input" | "complete"), components (jsonb: confirmed food, portion, preparation, per-component carb range), carbs_low_g, carbs_high_g (numeric), spoons_low, spoons_high (numeric), meal_impact (text: "low" | "moderate" | "high"), confidence_overall (integer), confidence_breakdown (jsonb: vision, portion, nutrition), meal_prepared (boolean, nullable), buffer_actions (jsonb).

**scan_corrections** (new)
* id (uuid, pk)
* scan_id (fk -> scans.id, on delete cascade)
* user_id (fk -> auth.users.id, matches `auth.uid()`)
* step (text: "food" | "portion" | "preparation" | "main_carbohydrate")
* original (jsonb), corrected (jsonb)
* created_at

**Legacy tables** (`dish_cache`, `dish_ingredients`, `allergy_profiles`) are frozen. They stay in the database, untouched, unused, and never referenced by new code.

## Required Endpoints
* `POST /api/scan`: image in, identified components out (food, portion, preparation, per-step confidence), plus a `questions` list for anything uncertain. Writes a `scans` row for the authenticated user with `status` set to `needs_input` or `complete`.
* `POST /api/estimate`: confirmed components in, carb range per component and total, Sugar Spoon range, Meal Impact, confidence breakdown, drivers, assumptions, and disclaimer out. Pure function over `food_nutrition`, no external calls. Updates the scan row.
* `POST /api/buffer`: scan result plus `meal_prepared` and optional `meal_eaten` in, ranked Prepare / Adjust / Recover actions out. Already-eaten meals receive Recover actions only. Pure function, no external calls.
* `POST /api/correct`: a user correction in, stored in `scan_corrections`, and the estimate recomputed from the corrected components.
* `GET /api/history`: the authenticated user's past scans, most recent first, with impact, spoon range, carb range, and timestamp.
* `GET /api/history/:id`: returns the authenticated user's saved result as stored, without recomputation.
* `DELETE /api/history/:id`: deletes one scan row, owned by the authenticated user only.

Retired: `POST /api/match` and `POST /api/ask-cook` (allergen era). Remove the route code in Unit 1; the tables stay.

Every response that contains a Sugar Spoon or Meal Impact value also contains a `disclaimer` string, and the frontend must render it next to those values.

## Response Shapes (Contract)
`POST /api/estimate` returns at minimum:
```
{
  scan_id,
  components: [{ food, portion, preparation, carbs_g: {low, high}, entry: {verified, source_note} }],
  total_carbs_g: {low, high},
  sugar_spoons: {low, high},
  meal_impact: "low" | "moderate" | "high",
  confidence: { overall, vision, portion, nutrition },
  drivers: [string],
  assumptions: [string],
  disclaimer: string
}
```
`POST /api/scan` returns `components`, `status`, and `questions: [{ component_id, step, prompt, options }]`. `POST /api/buffer` returns `actions: [{ tier: "prepare"|"adjust"|"recover", kind, text, rank }]`. Field names must let the frontend render labels without translation (see `3-ui-context.md`).

## Engines
**Confidence Engine.** Three scores, each 0-100, kept separate and returned separately:
* vision: how sure the model is about the food and its preparation.
* portion: how sure the model is about the size.
* nutrition: quality of the matched data (entry_confidence, and how wide the resulting range is).

Overall confidence is the lowest of the three, so one weak step is never hidden by averaging. It is a heuristic score of estimate quality, not a calibrated probability. Below a per-step threshold the app asks the user instead of guessing. Thresholds live in one config module.

**Nutrition Engine.** Looks up `food_nutrition` by food + preparation + portion. If portion is unconfirmed, the range widens to cover the plausible neighboring sizes and portion confidence drops. If preparation is unconfirmed, the assumed preparation is disclosed in `assumptions`. If a food has no row, the engine returns no number for it and the app asks the user to name the main carbohydrate from the seeded list.

**Sugar Spoon Index.** Total carbohydrate range converted to a range of spoons. Convention (proposed, confirm): 1 spoon = 4 g of carbohydrate. Shown as a range, rounded outward for display, with a one-line explanation of the convention. It is a visual carbohydrate-exposure count, not a glucose value.

**Meal Impact Profile.** A deterministic function of the total carb range plus context: preparation, presence of vegetables and protein, and per-component `gi_category` where an entry has one. Output is Low / Moderate / High plus the confidence percentage and a short `drivers` list (for example "large portion of white rice", "fried preparation", "vegetables and protein present"). The band is computed at the midpoint of the range; if the range straddles a band boundary, confidence is reduced and the UI notes the straddle (default, confirm). Thresholds and modifiers live in one config module, each with a documented basis.

**Buffer Engine.** Ranked by feasibility, not by ideal outcome:
1. Change the portion (Prepare if the meal is not cooked yet; Adjust as a smaller serving if it is).
2. Add vegetables or protein to what is already made (Adjust).
3. Change preparation, only if cooking has not started (Prepare).
4. Suggest light activity after eating (Recover).
5. Remember the pattern for next time (Recover).

`meal_prepared` gates the list: when the meal is already prepared, "Prepare" actions are never offered, so the answer to "the meal is already cooked for a family of five" is Adjust and Recover actions, never "replace the rice". No action text carries a numeric or guaranteed effect.

## Pages (Frontend Routes)
* `/` (landing when logged out; post-login home when logged in): primary "scan a meal" action and the latest result.
* `/signup`: Supabase Auth signup, email + password.
* `/login`: Supabase Auth login.
* `/scan`: photo capture, clarifying questions, result, "meal already prepared?", Buffer Engine.
* `/history`: list of past scans, tap through to see the full result again.
* `/profile`: display name and sign out.

This is a real multi-page app, not a single-page flow. Route protection redirects unauthenticated visits to `/login`.

## Auth / Access Model
* Real authentication via Supabase Auth, email + password. Signup and login are full pages.
* `scans` and `scan_corrections` are scoped to `auth.uid()`, enforced with Postgres Row Level Security policies, not just application-layer checks.
* `foods` and `food_nutrition` are readable by authenticated users and writable only through migrations or the service role.
* A logged-out user sees the landing, login, and signup pages only.
* Session handling uses Supabase's client SDK session, refreshed automatically.

## AI / Background Task Model
* `POST /api/scan` calls Gemini first. On a rate-limit or error response, it retries the same request against Groq before failing with a clear message.
* Callers use one function (`identifyMeal`) and never see which provider answered.
* Model output is treated as `unknown` and narrowed by a validator before use. A malformed response is an error, not a partial guess.
* Corrections are stored and applied to that scan only. They are never written into `foods` or `food_nutrition` automatically.

## Invariants (Hard Rules)
1. The app never claims to measure, predict, or estimate blood glucose, and never diagnoses. Every estimate is labeled as an estimate.
2. Every response containing a Sugar Spoon or Meal Impact value includes the disclaimer, and the frontend renders it on screen next to those values.
3. Carbohydrates are always returned and shown as a range. No single-number carbohydrate value ever leaves the API.
4. Every nutrition number comes from a verified `food_nutrition` row. The vision model never supplies nutrition values.
5. Uncertain food, portion, or preparation is asked about or disclosed, never silently guessed.
6. Every uncertain step has a user correction path.
7. `foods` and `food_nutrition` grow only through manual review. Corrections and model output never write to them.
8. No guaranteed or percentage-reduction claims anywhere, and no "don't eat" or "replace" advice for a meal that is already prepared.
9. Migrations are additive only. Never delete or destroy existing data, and never modify an applied migration.
10. No API keys (Gemini, Groq, Supabase service role) in client-side code. Only the two `NEXT_PUBLIC_*` Supabase values are allowed in the browser bundle.
11. `scans` and `scan_corrections` are protected by Row Level Security keyed to `auth.uid()`. A user must never be able to read or delete another user's rows, at the database level.
12. Live demo photos use only foods and preparations that have verified `food_nutrition` rows.
