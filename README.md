# ApetitScan

**One photo. An honest carbohydrate estimate. A realistic next step.**

ApetitScan helps people understand the carbohydrate load of everyday African meals — without false precision, without medical claims, and without guessing when it is not sure.

A user photographs a meal. The app identifies each food, portion, and preparation, asks about anything it is uncertain of, and returns a carbohydrate range from hand-verified Nigerian food data. It then suggests practical next steps based on where the user is with the meal.

---

## The problem

Millions of people make daily food decisions with no easy way to understand the carbohydrate burden of African meals. Existing nutrition apps require manual food search and are built on Western food databases. A phone camera cannot measure blood glucose — so this product does not claim to.

---

## What it does

| Step | What happens |
|---|---|
| **Scan** | User photographs a meal on their phone |
| **Identify** | Gemini (with Groq fallback) identifies each food, portion size, and preparation method |
| **Ask** | Anything below the confidence threshold becomes a question, not a guess |
| **Estimate** | Carbohydrate range calculated from hand-verified Nigerian food data only |
| **Explain** | Sugar Spoon Index and Meal Impact (Low / Moderate / High) shown with a visible disclaimer |
| **Act** | Buffer Engine suggests Prepare / Adjust / Recover actions based on meal state |
| **Correct** | Every assumption is editable; corrections are saved with the scan |

The app never gives a single carbohydrate number. Every result is a range. Every uncertain step is disclosed or asked about. The disclaimer is always on screen next to the result — not behind a
 tap.

---

## Demo plates

**Plate 1 — white rice, fried plantain, tomato stew, chicken**
Expected result: High Meal Impact, high carbohydrate range, Adjust actions when the meal is already prepared (reduce rice, add vegetables or protein — never "replace the rice").

**Plate 2 — boiled plantain, vegetables, fish**
Expected result: visibly lower Meal Impact than Plate 1, demonstrating that the system judges food, preparation, and portion — not a fixed "this food is bad" list.

---

## Honest by design

- Carbohydrates are always a range (`45–60 g`), never a single number
- The vision model identifies only — it never supplies nutrition values
- Every nutrition number traces to a verified `food_nutrition` row with a source note
- If a food has no verified row, the app asks the user instead of guessing
- The disclaimer `"This is an estimate from a photo, not a blood glucose measurement..."` is visible inside the result card without any tap
- Buffer suggestions are phrased as options (`"Consider..."`, `"If you have..."`) with no numeric or guaranteed effect
- A meal already prepared never receives a "replace" or "avoid" suggestion

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, Tailwind CSS |
| Backend | Next.js API routes (no separate server) |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth, email and password |
| Vision (primary) | Google Gemini (free tier, Google AI Studio key) |
| Vision (fallback) | Groq (free tier, OpenAI-compatible) |
| Hosting | Vercel Hobby |

Everything runs on zero-dollar free tiers. No card on file anywhere in the stack.

---

## Architecture

```
Meal photo
  → Food ID + Portion + Preparation        (Gemini → Groq fallback)
  → Confidence Engine                      (vision / portion / nutrition, scored separately)
  → Clarifying questions where uncertain   (user confirms or corrects)
  → Nutrition Engine                       (verified food_nutrition rows only)
  → Sugar Spoon Index                      (carb range ÷ 4 g per spoon, rounded outward)
  → Meal Impact Profile                    (Low / Moderate / High from carb midpoint)
  → Buffer Engine                          (Prepare / Adjust / Recover by feasibility)
  → Correction stored with the scan
```

**Hard boundary:** the vision model identifies, the Nutrition Engine calculates. These two never cross. No model-supplied nutrition number ever reaches the user.

**Confidence Engine:** three separate scores (vision, portion, nutrition). Overall confidence is the lowest of the three — one weak step is never hidden by averaging.

**Meal Impact thresholds:** midpoint below 50 g = Low, 50–100 g = Moderate, above 100 g = High. Vegetables, protein, and preparation are explanatory drivers only — they do not shift the band. These are prototype heuristics, not clinical cutoffs.

---

## Data

The verified food set covers both demo plates: white rice, plantain (boiled and fried), tomato stew, chicken, vegetables, and fish. Each food has Small, Medium, and Large rows per preparation. Every row has:

- A carbohydrate range scaled from cited per-100 g values
- A `source_note` linking to the source (FAO/INFOODS West Africa Food Composition Table 2019, Nigeria Food Composition Table 2017, peer-reviewed Nigerian dietary studies)
- An `entry_confidence` score
- No GI category unless a matching GI source was verified

The fried vs. boiled plantain entries (48.0 g/100 g vs. 18.4 g/100 g) demonstrate that preparation matters and is tracked separately.

---

## Security and safety

- `scans` and `scan_corrections` are protected by Postgres Row Level Security scoped to `auth.uid()` — a user cannot read or delete another user's rows at the database level
- No API key (Gemini, Groq, Supabase service role) appears in client-side code or any `NEXT_PUBLIC_*` variable other than the two approved Supabase values
- Corrections are stored per scan only — they never write back to `foods` or `food_nutrition`
- Migrations are additive only; no legacy table or column is dropped

---

## Running locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

Apply the migrations in `supabase/migrations/` through the Supabase SQL editor in order, then run the app.

---

## API endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/scan` | Photo in, identified components and clarification questions out |
| `POST` | `/api/estimate` | Confirmed components in, carbohydrate range and Meal Impact out |
| `POST` | `/api/correct` | Store a user correction and recompute the estimate |
| `POST` | `/api/buffer` | Meal state in, ranked Prepare / Adjust / Recover actions out |
| `GET` | `/api/history` | Authenticated user's scans, newest first |
| `GET` | `/api/history/:id` | One saved scan result, without recomputation |
| `DELETE` | `/api/history/:id` | Delete one owned scan |

Full request/response shapes and manual acceptance steps are in `API.md`.

---

## What this is not

- Not a glucose monitor or blood glucose predictor
- Not a medical device or diagnostic tool
- Not a large food database — quality and verification over coverage
- Not a guaranteed outcome engine — no action carries a numeric or percentage effect

---

## Roadmap (pitch only, not in this build)

- **Phase 1** — premium history, personalized patterns, household tracking
- **Phase 2** — B2B African Food Intelligence API (structured JSON: food, portion, carb range, impact, confidence)
- **Phase 3** — healthcare and HMO integration, only after validation, published evidence, and regulatory review

The long-term moat is a structured African food database with a correction-driven data flywheel — not the model.
