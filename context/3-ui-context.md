# API Response & Safety Language Context

This file covers the words, labels, and claims the API and frontend are allowed to produce. Since this is a single-repo, full-stack build, these rules bind both the API responses and the components that render them, they are not split by role.

## Core Public Language
"PetitScan flags what's commonly in a dish, and gives you the question to ask before you eat it."

## Approved Status Vocabulary
Use these terms, and only these, for scan results:
* Verified (dish found in `dish_cache`, hand-checked)
* Estimated (dish not in cache, answered by LLM fallback)
* Always contains / Commonly contains / Sometimes contains
* Not typically found in this dish

These map directly to `dish_ingredients.tier` and `scans.source`. API responses and UI copy must use these exact terms or their direct plain-language equivalents above.

## Claims the API and Frontend Must Never Make or Imply
Do not return, render, or structurally support any of the following:
* "Safe to eat" or any synonym of it.
* "Does not contain [allergen]" as a guarantee.
* A specific numeric confidence percentage presented as certainty (e.g. "98% allergen-free").
* Any medical or diagnostic claim, or language implying this replaces a doctor, an allergist, or reading a real ingredient label when one exists.
* Treating an `llm_fallback` (Estimated) result with the same certainty as a `cache` (Verified) result.

## Tier Definitions (for consistent copy)
* **Always**: present in essentially every version of this dish.
* **Commonly**: present in most versions, but real recipe variation exists.
* **Sometimes**: present in some households' versions, not others, this is the tier where the "ask the cook" question matters most.

## Frontend Labels (for backend awareness)
Field names and returned values should let the frontend render `Verified` / `Estimated` and the three tiers directly, without translation or guesswork on the frontend side. If a field name changes on the backend, the UI labels above must still be reachable without a rewrite.

## Ingredient and nutrition presentation
* Show possible ingredients grouped as `Always contains`, `Commonly contains`, and `Sometimes contains`; preserve the scan's `Verified` or `Estimated` label nearby.
* Nutrition guidance may describe qualitative ingredient-based cues (for example, a likely carbohydrate or protein source) and broad meal-balancing ideas.
* Never infer exact calories or grams of macronutrients from a photograph without measured portion sizes and recipe quantities. State when values are unavailable; do not invent them.
* Nutrition tips are general food information, not individualized calorie targets, medical advice, or a diagnosis.
