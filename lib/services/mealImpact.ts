import { MEAL_IMPACT_THRESHOLDS_G } from "./nutritionConfig";
import type { Range } from "./nutrition";

export type MealImpactBand = "low" | "moderate" | "high";
export type MealComponentCategory = "carb_staple" | "protein" | "vegetable" | "stew_soup" | "other";

export interface MealImpactComponent {
  food: string;
  category: MealComponentCategory;
  preparation?: string | null;
}

export interface MealImpactResult {
  meal_impact: MealImpactBand;
  drivers: string[];
  range_straddles_band: boolean;
  boundary_note: string | null;
}

function validateRange(range: Range): void {
  if (
    !Number.isFinite(range.low) || !Number.isFinite(range.high) ||
    range.low < 0 || range.high < range.low
  ) throw new Error("Meal Impact requires a valid non-negative carbohydrate range.");
}

function bandFor(midpoint: number): MealImpactBand {
  if (midpoint < MEAL_IMPACT_THRESHOLDS_G.lowUpperExclusive) return "low";
  if (midpoint <= MEAL_IMPACT_THRESHOLDS_G.moderateUpperInclusive) return "moderate";
  return "high";
}

function crossesBoundary(range: Range): boolean {
  const crossesLow = range.low < MEAL_IMPACT_THRESHOLDS_G.lowUpperExclusive &&
    range.high >= MEAL_IMPACT_THRESHOLDS_G.lowUpperExclusive;
  const crossesHigh = range.low <= MEAL_IMPACT_THRESHOLDS_G.moderateUpperInclusive &&
    range.high > MEAL_IMPACT_THRESHOLDS_G.moderateUpperInclusive;
  return crossesLow || crossesHigh;
}

/** Assigns the band from carbohydrate midpoint only; food context is explanatory, not a modifier. */
export function calculateMealImpact(range: Range, components: MealImpactComponent[]): MealImpactResult {
  validateRange(range);
  const midpoint = (range.low + range.high) / 2;
  const mealImpact = bandFor(midpoint);
  const drivers = [`The carbohydrate-range midpoint falls in the ${mealImpact[0].toUpperCase()}${mealImpact.slice(1)} band.`];
  const categories = new Set(components.map((component) => component.category));

  if (categories.has("vegetable")) drivers.push("Vegetables are included among the identified components.");
  if (categories.has("protein")) drivers.push("Protein is included among the identified components.");

  const preparations = [...new Set(components
    .map((component) => component.preparation?.trim())
    .filter((preparation): preparation is string =>
      typeof preparation === "string" && preparation.length > 0 && preparation.toLocaleLowerCase("en") !== "uncertain",
    ))]
    .sort((a, b) => a.localeCompare(b));
  if (preparations.length > 0) drivers.push(`Identified preparation: ${preparations.join(", ")}.`);

  const straddles = crossesBoundary(range);
  return {
    meal_impact: mealImpact,
    drivers,
    range_straddles_band: straddles,
    boundary_note: straddles ? "The carbohydrate range crosses a Meal Impact band boundary." : null,
  };
}
