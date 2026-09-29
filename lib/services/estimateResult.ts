import { calculateConfidence, type ConfidenceComponentInput } from "./confidence";
import { calculateMealImpact, type MealComponentCategory } from "./mealImpact";
import { calculateNutrition, type FoodNutritionEntry, type NutritionComponentInput, type PortionGuess } from "./nutrition";
import { DISCLAIMER_TEXT } from "./nutritionConfig";
import { toSugarSpoonRange } from "./sugarSpoon";

export interface EstimateRequestComponent {
  component_id: string;
  food: string;
  food_confirmed: boolean;
  portion: PortionGuess;
  portion_confirmed: boolean;
  preparation: string | null;
  preparation_confirmed: boolean;
}

export interface EstimateStoredComponent {
  component_id: string;
  food: string;
  confidence: { food: number; portion: number; preparation: number };
  requires_confirmation: { food: boolean; portion: boolean; preparation: boolean };
}

export interface EstimateFood {
  id: string;
  name: string;
  category: MealComponentCategory;
}

export function buildEstimateResult(
  requested: EstimateRequestComponent[],
  stored: EstimateStoredComponent[],
  matchedFoods: Map<string, EstimateFood>,
  entries: FoodNutritionEntry[],
) {
  const storedById = new Map(stored.map((component) => [component.component_id, component]));
  const nutritionInputs: NutritionComponentInput[] = requested.map((component) => ({
    component_id: component.component_id,
    food: matchedFoods.get(component.component_id)!.name,
    portion: component.portion,
    portion_confirmed: component.portion_confirmed,
    preparation: component.preparation,
    preparation_confirmed: component.preparation_confirmed,
  }));
  const nutrition = calculateNutrition(nutritionInputs, entries);
  const components = requested.map((component) => {
    const original = storedById.get(component.component_id)!;
    const food = matchedFoods.get(component.component_id)!;
    const calculated = nutrition.components.find((item) => item.component_id === component.component_id)!;
    return {
      component_id: component.component_id,
      food: food.name,
      food_id: food.id,
      category: food.category,
      food_verified: true,
      food_confirmed: component.food_confirmed,
      portion: component.portion,
      portion_confirmed: component.portion_confirmed,
      preparation: calculated.preparation ?? component.preparation,
      preparation_confirmed: component.preparation_confirmed,
      confidence: original.confidence,
      requires_confirmation: {
        food: false,
        portion: !component.portion_confirmed,
        preparation: !component.preparation_confirmed,
      },
      carbs_g: calculated.carbs_g,
      entry: calculated.entry,
    };
  });

  if (!nutrition.ready || !nutrition.total_carbs_g) {
    return {
      ready: false as const,
      components,
      questions: nutrition.questions,
      assumptions: nutrition.assumptions,
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  const confidenceInputs: ConfidenceComponentInput[] = nutrition.components.map((component) => {
    const request = requested.find((item) => item.component_id === component.component_id)!;
    const original = storedById.get(component.component_id)!;
    if (!component.carbs_g || !component.entry) throw new Error("The nutrition estimate is missing a verified component range.");
    return {
      confidence: original.confidence,
      portion_confirmed: request.portion_confirmed,
      nutrition_entry_confidence: component.entry.entry_confidence,
      carbs_g: component.carbs_g,
    };
  });
  const confidence = calculateConfidence(confidenceInputs);
  const impact = calculateMealImpact(nutrition.total_carbs_g, requested.map((component) => {
    const food = matchedFoods.get(component.component_id)!;
    const calculated = nutrition.components.find((item) => item.component_id === component.component_id)!;
    return { food: food.name, category: food.category, preparation: calculated.preparation };
  }));
  const spoons = toSugarSpoonRange(nutrition.total_carbs_g);
  return {
    ready: true as const,
    components,
    total_carbs_g: nutrition.total_carbs_g,
    sugar_spoons: spoons,
    meal_impact: impact.meal_impact,
    confidence,
    drivers: impact.drivers,
    assumptions: nutrition.assumptions,
    questions: nutrition.questions,
    range_straddles_band: impact.range_straddles_band,
    boundary_note: impact.boundary_note,
    disclaimer: DISCLAIMER_TEXT,
  };
}
