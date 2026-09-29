import type { Range } from "./nutrition";

export interface ConfidenceComponentInput {
  confidence: {
    food: number;
    portion: number;
    preparation: number;
  };
  portion_confirmed: boolean;
  nutrition_entry_confidence: number;
  carbs_g: Range;
}

export interface ConfidenceBreakdown {
  vision: number;
  portion: number;
  nutrition: number;
  overall: number;
}

function clampConfidence(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite confidence score.`);
  return Math.min(100, Math.max(0, value));
}

function validateRange(range: Range): void {
  if (
    !Number.isFinite(range.low) || !Number.isFinite(range.high) ||
    range.low < 0 || range.high < range.low
  ) throw new Error("Confidence requires a valid non-negative carbohydrate range.");
}

/** Combines per-step scores exactly by the minimum rule; unverified/missing rows are not accepted. */
export function calculateConfidence(components: ConfidenceComponentInput[]): ConfidenceBreakdown {
  if (components.length === 0) throw new Error("At least one resolved meal component is required for confidence scoring.");

  const visionScores: number[] = [];
  const portionScores: number[] = [];
  const nutritionScores: number[] = [];

  for (const [index, component] of components.entries()) {
    validateRange(component.carbs_g);
    const foodConfidence = clampConfidence(component.confidence.food, `Component ${index + 1} food`);
    const portionModelConfidence = clampConfidence(component.confidence.portion, `Component ${index + 1} portion`);
    const preparationConfidence = clampConfidence(component.confidence.preparation, `Component ${index + 1} preparation`);
    const nutritionEntryConfidence = clampConfidence(component.nutrition_entry_confidence, `Component ${index + 1} nutrition entry`);

    visionScores.push(Math.min(foodConfidence, preparationConfidence));
    portionScores.push(component.portion_confirmed ? 100 : portionModelConfidence);

    const { low, high } = component.carbs_g;
    const rangeTightness = low === 0 && high === 0 ? nutritionEntryConfidence : (low / high) * 100;
    nutritionScores.push(Math.min(nutritionEntryConfidence, clampConfidence(rangeTightness, `Component ${index + 1} range tightness`)));
  }

  const vision = Math.min(...visionScores);
  const portion = Math.min(...portionScores);
  const nutrition = Math.min(...nutritionScores);
  return { vision, portion, nutrition, overall: Math.min(vision, portion, nutrition) };
}
