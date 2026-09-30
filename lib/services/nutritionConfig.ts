/** Proposed convention from context/2-architecture.md: one spoon represents 4 g carbohydrate. */
export const GRAMS_PER_SPOON = 4;

export const DISCLAIMER_TEXT = "This is an estimate from a photo, not a blood glucose measurement. Carbohydrate figures are ranges based on the foods, portions and preparation shown here. Change an assumption and the estimate updates.";

/** User-approved Unit 6 carbohydrate midpoint bands; contextual foods do not shift these thresholds. */
export const MEAL_IMPACT_THRESHOLDS_G = {
  lowUpperExclusive: 50,
  moderateUpperInclusive: 100,
} as const;

/** Product heuristic: predictions below this per-step score require user confirmation. */
export const IDENTIFICATION_CONFIRMATION_THRESHOLD = 70;
