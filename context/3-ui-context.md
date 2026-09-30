# Product Language and Visual System Context

This file binds API responses, AI prompt templates, and every user-visible string and screen. It is a single-repo full-stack build, so these rules apply equally to backend copy and frontend components.

## Core Public Language
"ApetitScan estimates the carbohydrate load of a meal from a photo, shows how sure it is, and suggests realistic next steps."

## Approved Vocabulary
Use these terms, and only these, for scan results:
* Estimated carbohydrate: always a range in grams.
* Carb spoons: the unit of the SugarSpoonMeter. An abstract unit defined once in the backend (`SPOON_GRAMS`). Never described as teaspoons of sugar.
* Estimated Meal Impact: Low, Moderate, High.
* Confidence: High, Medium, Low, shown separately for Food, Portion, Preparation. Never a percentage.
* Assumed and Confirmed: the status of every food, portion, and preparation.
* Verified data and Estimated data: the source of the nutrition figures.
* Buffer sections, as the user sees them: Before you cook, Before you eat, After you eat.

Loading copy, exact: "Identifying foods..." then "Estimating carbohydrates..."

## Required Disclaimer (EstimateDisclaimer, exact wording)
"This is an estimate from a photo, not a blood glucose measurement. Carbohydrate figures are ranges based on the foods, portions and preparation shown here. Change an assumption and the estimate updates."

It must be visible inside the same card as the Meal Impact result without any tap. Not behind an info icon, not in a tooltip, not in settings. Minimum 13px, readable contrast, visually quieter than the result but never tiny.

## Claims the API and Frontend Must Never Make or Imply
* A blood glucose value, a glucose unit (mg/dL, mmol/L), a "reading", or a curve presented as the user's response.
* A single fake-precise carbohydrate number. Ranges only, written "45 to 60 g", not "52.4 g".
* Any accuracy or outcome percentage ("92% accurate", "lowers the spike by 15%").
* Medical diagnosis, treatment advice, or the word "safe".
* AI marketing labels ("AI-powered", "smart", "magic") and vague loading copy ("thinking", "processing").
* Treating Estimated data with the certainty of Verified data.

## Buffer Language Rules
* Phrase suggestions as options: "Consider...", "If you have...".
* Follow the cooking state. Not cooked yet: portion, addition, and preparation options. Cooked, not eaten: portion and addition options only. Already eaten: light activity "where appropriate", and nothing about changing the meal.
* Never say replace, swap, discard, skip, avoid, or "do not eat" for a meal that is already made or eaten.
* No numeric outcome for any action.
* Footer line under the actions: "General suggestions, not medical advice."

## Confidence Rules
* Levels are High, Medium, Low for Food, Portion, Preparation.
* Overall confidence is never higher than the weakest layer.
* Medium or Low shows a one-line reason. Portion: "Portion size is estimated from a single photo." Preparation: "The photo does not clearly show how this was cooked." Food: "Some foods were hard to tell apart in the photo."

## Visual System
Mobile-first consumer health utility. It should look like a product a startup could ship, not an AI concept.
* Color: white and very light neutral backgrounds, near-black text, the existing blue as the only interaction color. Semantic accents (impact dot, Assumed/Confirmed) are muted and always paired with text.
* Type: one sans family already in the project, weights 400, 500, 600. Scale: 28/32 result, 20/26 title, 16/24 body, 14/20 secondary, 13/18 disclaimer, 12/16 caption minimum.
* Shape: 14px radius for controls and rows, 18px for containers, 1px borders, no shadows except a bottom sheet.
* Layout: hierarchy from type, whitespace, and hairline dividers. Containers only where they improve hierarchy. No card inside a card.
* Icons: Tabler Icons only (`@tabler/icons-react`). No emoji as icons, no second icon library. The spoon glyph in SugarSpoonMeter is an original SVG.
* Motion: 150 to 200ms for selection and sheets only. Respect `prefers-reduced-motion`.
* Never: gradient blobs, glow borders, glassmorphism, robot or sparkle imagery, giant percentages, decorative charts, fake clinical dashboards.
* Mobile first: 44px minimum tap targets, primary actions in thumb reach, no horizontal overflow at 360px width, safe-area insets respected.