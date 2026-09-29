# API Response & Safety Language Context

This file covers the words, labels, and claims the API and frontend are allowed to produce. Since this is a single-repo, full-stack build, these rules bind both the API responses and the components that render them, they are not split by role.

## Core Public Language
"ApetitScan estimates the carbohydrate load of your meal from a photo, asks when it isn't sure, and suggests realistic ways to balance it. It is an estimate, not a glucose measurement."

## Required Disclaimer (Exact Text)
`This is an estimate of carbohydrate exposure, not a glucose measurement.`

* Defined once as a shared constant (`DISCLAIMER_TEXT`) and returned in the `disclaimer` field of every response that contains a Sugar Spoon or Meal Impact value.
* Rendered on screen, in the same card as the Sugar Spoon Index and the Meal Impact profile, visible without tapping, expanding, or opening settings.
* The word "glucose" appears in user-facing copy only inside this disclaimer.

## Approved Vocabulary
Use these terms, and only these, for scan results:
* Estimated carbohydrates: a range, always `X–Y g`.
* Sugar Spoon Index: a range of spoons, always `X–Y spoons`, with a one-line note on what one spoon represents.
* Meal Impact: Low / Moderate / High.
* Estimate confidence: a percentage, with the breakdown labeled Food recognition, Portion, Nutrition data.
* Portion: Small / Medium / Large.
* Preparation: the seeded preparation labels (for example Boiled, Fried).
* Verified entry: the food data row was hand-checked, shown with its source note.
* Prepare / Adjust / Recover: the three Buffer Engine groups.

API values are lowercase (`low`, `moderate`, `high`, `small`, `medium`, `large`) and map one-to-one to the labels above.

## Claims the API and Frontend Must Never Make or Imply
Do not return, render, or structurally support any of the following:
* That the app measures, predicts, or estimates blood glucose or "blood sugar", or that it predicts a "spike".
* Any diagnosis, disease prediction, medical advice, or language implying it replaces a doctor or dietitian.
* A single-number carbohydrate value, food weight, or palm-oil quantity presented as exact.
* Calories, fat, or protein grams. The MVP shows carbohydrate ranges only.
* A guaranteed or percentage effect from any suggestion ("drops your spike by 15%", "reduces sugar by half").
* A confidence percentage shown without the estimate and range it belongs to, or presented as the accuracy of a glucose outcome.
* That a food is "bad", "unhealthy", "unsafe", or that the user should not eat it. No "avoid", "don't eat", or "never eat".
* "Replace the rice" (or any swap) for a meal the user said is already prepared.
* Labels like "diabetic-friendly" or "sugar-free".

## Confidence Language
* Shown as `Estimate confidence: NN%`. It is a score of how reliable the estimate is, not a probability that a health outcome will happen.
* The breakdown (Food recognition, Portion, Nutrition data) is available on the result screen. When one step is the weakest, the copy says which one.

## Asking Instead of Guessing (Copy Patterns)
* Portion: "How big was the portion?" with Small / Medium / Large.
* Preparation: "Was this fried or boiled?" as a short multiple choice, options taken from the seeded preparations for that food.
* Unidentified dish: "I couldn't identify this dish. What's the main carbohydrate?" with the seeded main-carb list.
* Meal state: "Has this meal already been prepared?" with Yes / Not yet.
* Assumptions are disclosed in plain language next to the result, for example "Preparation not confirmed, assumed boiled. Tap to change." Every question and assumption leads to a correction the user can make.

## Buffer Engine Presentation
* Grouped as Prepare, Adjust, Recover, ranked by feasibility, shown as suggestions, not rules.
* Tone: practical and non-judgmental. Examples of acceptable copy: "Try a smaller serving of rice.", "Add vegetables or protein to the plate.", "A light walk after eating is an easy option.", "We'll keep this scan in your history so patterns are easy to spot later."
* No numeric effect, no outcome promise, and no wording that implies the user did something wrong.
* If the meal is already prepared, only Adjust and Recover groups are shown.

## Meal Impact Presentation
* Show the band, the confidence percentage, the total carbohydrate range, and the `drivers` list ("Why this rating") together.
* The same components, judged with different preparation or portion, can and should produce a different impact. The UI never presents a fixed per-food verdict.
* If the range straddles a band boundary, say so in one line rather than hiding it.

## Frontend Labels (for backend awareness)
Field names and returned values must let the frontend render every label above directly, without translation or guesswork. Expected fields: `total_carbs_g`, `sugar_spoons`, `meal_impact`, `confidence`, `drivers`, `assumptions`, `disclaimer`, and for each component `entry.verified` and `entry.source_note`. If a field name changes on the backend, the labels above must still be reachable without a rewrite.

## Grep List for the Safety Pass
Search all user-facing strings, prompt templates, and comments that may surface for: `safe`, `unsafe`, `healthy`, `unhealthy`, `bad food`, `avoid`, `don't eat`, `never eat`, `diabetic`, `diagnos`, `spike`, `guarantee`, `lower your blood`, `sugar-free`, `blood sugar`, `glucose`, `calorie`, and any `%` used outside the confidence figure. `glucose` is allowed only inside `DISCLAIMER_TEXT`. Anything else that matches is removed or rewritten.
