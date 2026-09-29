# AI Workflow Rules

**Act as an expert AI coding agent working full stack on ApetitScan for a hackathon build with a September 30, 2026 deadline. You must strictly obey the following commands.**

## Overall Approach
* Spec driven: confirm the data model, endpoint contract, and safety-language rules in `2-architecture.md` and `3-ui-context.md` before writing code.
* Incremental execution: build one atomic unit (one migration, one endpoint, one component) at a time, from `7-units.md`, in order. Do not write the whole app in a single response unless explicitly commanded.
* Time is short. Protect the non-negotiables first (ranges, disclaimer on screen, ask-instead-of-guess, correction flow, verified data for the two demo plates). Follow the cut line in `7-units.md` if time runs out.

## The Non-Negotiable Principle
Never give false precision. If portion is uncertain, show a range. If food is uncertain, ask. If preparation is uncertain, disclose it. Every estimate is labeled as an estimate. The Sugar Spoon Index and Meal Impact Profile both carry the "not a glucose measurement" disclaimer, shown on screen, not buried in settings.

## Scoping Rules
* No speculative features. The following are out unless `1-project-overview.md` is updated first: glucose measurement or prediction, diagnosis, disease prediction, guaranteed percentage reductions, exact food or palm-oil weight from a photo, HMO or healthcare features, CGM, a large food database, payments, premium tiers, the B2B API, and cuisines beyond the verified Nigerian set.
* The pivot from PetitScan is authorized. Retiring the allergen UI, the allergen endpoints (`/api/match`, `/api/ask-cook`), and old product-name strings happens in Unit 1 and only there. Legacy database tables stay untouched.
* No risky broad deletion or refactor without being asked.

## Handling Ambiguity
* If a requirement contradicts `1-project-overview.md`, `2-architecture.md`, the Non-Negotiable Principle, or the safety-language rules in `3-ui-context.md`, or a critical detail is missing, stop. State the conflict clearly and ask for direction. Do not assume, and do not soften a safety rule to make a task easier to complete.
* Where a value is marked "confirm" or TBD (impact thresholds, spoon convention, ask-thresholds), use the documented default, record it in `API.md` and the tracker's open questions, and keep it in `lib/config` so it is one edit to change.

## File Restrictions
* Never invent nutrition data. Every `food_nutrition` row is hand-verified with a `source_note`; if a food has no verified row, the app asks the user, it does not guess.
* Never let the vision model output, or any prompt template, produce carbohydrate or other nutrition numbers.
* Never write corrections or model output into `foods` or `food_nutrition` automatically. Those tables change only through manual review.
* Never modify a database migration once it has been applied. Never drop legacy tables or columns.
* Never commit `.env` files, API keys, or archives.
* Never add glucose, blood-sugar, diagnostic, "safe", "healthy", "avoid", or certainty language, or a guaranteed effect, to any user-facing string, in code, in a prompt template, or in a comment that later gets surfaced. Use the grep list in `3-ui-context.md`.

## Documentation Sync
* Every new endpoint, model, migration, and tunable rule is logged in `API.md` in the same session it's built.
* Flag `2-architecture.md` for an update whenever the real implementation diverges from what it currently documents.
* Update `6-progress-tracker.md` at the end of every unit.

## Verification Checklist
Before declaring a unit complete, verify internally:
* [ ] Carbohydrates are returned and rendered only as ranges. No single-number carbohydrate value appears in the API or UI.
* [ ] Every screen and response showing a Sugar Spoon or Meal Impact value also shows the disclaimer text on screen, without expanding anything.
* [ ] Every uncertain step (food, portion, preparation) produces a question or a disclosed assumption, and each has a working correction path.
* [ ] Every nutrition number traces to a verified `food_nutrition` row. The vision prompt asks for no nutrition values.
* [ ] "Meal already prepared?" is asked, and when the answer is yes no Prepare actions and no "replace" wording are shown.
* [ ] No user-facing string contains a forbidden term or a guaranteed or percentage effect (grep list passes).
* [ ] A Gemini failure correctly falls back to Groq, and the request fails with a clear message if both fail.
* [ ] No API key appears in any client-side bundle or `NEXT_PUBLIC_*` variable other than the two approved Supabase values.
* [ ] RLS on `scans` and `scan_corrections` blocks cross-user reads and deletes, tested rather than assumed.
* [ ] The change is documented in `API.md`.

*Only move to the next unit after these checks are satisfied.*
