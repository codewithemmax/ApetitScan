# AI Workflow Rules

**Act as an expert AI coding agent working full stack on [App Name TBD] for a one-week hackathon build. You must strictly obey the following commands.**

## Overall Approach
* Spec driven: confirm the data model, endpoint contract, and safety-language rules in `2-architecture.md` and `3-ui-context.md` before writing code.
* Incremental execution: build one atomic unit (one model, one endpoint, one component) at a time, from `7-units.md`, in order. Do not write the whole app in a single response unless explicitly commanded.

## Scoping Rules
* No speculative features: no auth system, no payments, no cuisines beyond Nigeria, none of it, unless `1-project-overview.md` is updated first to bring it into scope.
* No risky broad deletion or refactor without being asked.

## Handling Ambiguity
* If a requirement contradicts `1-project-overview.md`, `2-architecture.md`, or the safety-language rules in `3-ui-context.md`, or a critical detail is missing, stop. State the conflict clearly and ask for direction. Do not assume, and do not soften a safety rule to make a task easier to complete.

## File Restrictions
* Never write LLM fallback output into `dish_cache` automatically. That table changes only through manual review.
* Never modify a database migration once it has been applied.
* Never commit `.env` files, API keys, or archives.
* Never add "safe," "does not contain," or a certainty claim to any user-facing string, in code, in a prompt template, or in a comment that later gets surfaced.

## Documentation Sync
* Every new endpoint, model, or migration is logged in `API.md` in the same session it's built.
* Flag `2-architecture.md` for an update whenever the real implementation diverges from what it currently documents.

## Verification Checklist
Before declaring a unit complete, verify internally:
* [ ] The response never states or implies a dish "is safe" or "does not contain" an allergen.
* [ ] Every flagged allergen has an accompanying "ask the cook" question.
* [ ] The result is labeled `Verified` or `Estimated`, and the label is visible in the UI, not just in the API payload.
* [ ] A cache hit never calls Gemini or Groq.
* [ ] A cache miss correctly falls back from Gemini to Groq on a rate-limit or error, and fails with a clear message if both fail.
* [ ] No API key appears in any client-side bundle or `NEXT_PUBLIC_*` variable other than the two approved Supabase values.
* [ ] The change is documented in `API.md`.

*Only move to the next unit after these checks are satisfied.*
