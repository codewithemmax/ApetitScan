export type PortionSize = "small" | "medium" | "large";
export type PortionGuess = PortionSize | "uncertain";
export type NutritionQuestionStep = "food" | "portion" | "preparation";

export interface Range {
  low: number;
  high: number;
}

/** A food_nutrition row joined to its parent food name and verification flag. */
export interface FoodNutritionEntry {
  food: string;
  verified: boolean;
  preparation: string;
  portion_size: PortionSize;
  carbs_low_g: number;
  carbs_high_g: number;
  source_note: string;
}

export interface NutritionComponentInput {
  component_id: string;
  food: string;
  portion: PortionGuess;
  portion_confirmed: boolean;
  /** Model guess or user selection; omit when preparation is unknown. */
  preparation?: string | null;
  preparation_confirmed: boolean;
}

export interface NutritionQuestion {
  component_id: string;
  step: NutritionQuestionStep;
  prompt: string;
  options: string[];
}

export interface EstimatedNutritionComponent {
  component_id: string;
  food: string;
  portion: PortionGuess;
  preparation: string | null;
  carbs_g: Range | null;
  entry: { verified: true; source_note: string } | null;
  needs_input: boolean;
}

export interface NutritionEstimate {
  components: EstimatedNutritionComponent[];
  total_carbs_g: Range | null;
  assumptions: string[];
  questions: NutritionQuestion[];
  ready: boolean;
}

const PORTION_ORDER: PortionSize[] = ["small", "medium", "large"];

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function validEntry(entry: FoodNutritionEntry): boolean {
  return entry.verified === true && Boolean(entry.food.trim()) && Boolean(entry.preparation.trim()) &&
    PORTION_ORDER.includes(entry.portion_size) && Boolean(entry.source_note.trim()) &&
    Number.isFinite(entry.carbs_low_g) && Number.isFinite(entry.carbs_high_g) &&
    entry.carbs_low_g >= 0 && entry.carbs_high_g >= entry.carbs_low_g;
}

function makeQuestion(
  component: NutritionComponentInput,
  step: NutritionQuestionStep,
  prompt: string,
  options: string[] = [],
): NutritionQuestion {
  return { component_id: component.component_id, step, prompt, options };
}

function emptyResult(component: NutritionComponentInput): EstimatedNutritionComponent {
  return {
    component_id: component.component_id,
    food: component.food,
    portion: component.portion,
    preparation: null,
    carbs_g: null,
    entry: null,
    needs_input: true,
  };
}

function plausiblePortions(portion: PortionGuess): PortionSize[] {
  if (portion === "uncertain") return [...PORTION_ORDER];
  const index = PORTION_ORDER.indexOf(portion);
  return PORTION_ORDER.filter((_, candidate) => Math.abs(candidate - index) <= 1);
}

function calculateComponent(
  component: NutritionComponentInput,
  allEntries: FoodNutritionEntry[],
): { result: EstimatedNutritionComponent; assumptions: string[]; questions: NutritionQuestion[] } {
  const foodRows = allEntries.filter((entry) =>
    validEntry(entry) && normalize(entry.food) === normalize(component.food),
  );

  if (foodRows.length === 0) {
    return {
      result: emptyResult(component),
      assumptions: [],
      questions: [makeQuestion(component, "food", "I couldn't match this food to a verified entry. Please identify it or choose the main carbohydrate.")],
    };
  }

  const preparations = [...new Set(foodRows.map((entry) => entry.preparation))]
    .sort((a, b) => a.localeCompare(b));
  const requested = component.preparation?.trim() || "";
  let preparation = preparations.find((value) => normalize(value) === normalize(requested));
  if (!preparation && !component.preparation_confirmed && preparations.length === 1) {
    preparation = preparations[0];
  }

  if (!preparation) {
    return {
      result: { ...emptyResult(component), preparation: requested || null },
      assumptions: [],
      questions: [makeQuestion(component, "preparation", "Which preparation was used?", preparations)],
    };
  }

  const assumptions: string[] = [];
  const questions: NutritionQuestion[] = [];
  if (!component.preparation_confirmed) {
    assumptions.push(`Preparation not confirmed; using ${preparation} for this estimate.`);
    questions.push(makeQuestion(component, "preparation", "Which preparation was used?", preparations));
  }

  const preparationRows = foodRows.filter((entry) => normalize(entry.preparation) === normalize(preparation));
  const portions = component.portion_confirmed
    ? (component.portion === "uncertain" ? [] : [component.portion])
    : plausiblePortions(component.portion);
  const selectedRows = preparationRows.filter((entry) => portions.includes(entry.portion_size));

  if (selectedRows.length === 0) {
    return {
      result: { ...emptyResult(component), preparation },
      assumptions,
      questions: [...questions, makeQuestion(component, "portion", "No verified serving entry matches this portion. Please choose a supported portion size.", PORTION_ORDER)],
    };
  }

  if (!component.portion_confirmed) {
    const tiers = component.portion === "uncertain" ? "all seeded portion sizes" : `the ${portions.join(" and ")} portion tiers`;
    assumptions.push(`Portion not confirmed; the range covers ${tiers}.`);
    questions.push(makeQuestion(component, "portion", "How big was the portion?", PORTION_ORDER));
  }

  const low = Math.min(...selectedRows.map((entry) => entry.carbs_low_g));
  const high = Math.max(...selectedRows.map((entry) => entry.carbs_high_g));
  return {
    result: {
      component_id: component.component_id,
      food: component.food,
      portion: component.portion,
      preparation,
      carbs_g: { low, high },
      entry: { verified: true, source_note: selectedRows.map((entry) => entry.source_note).join("\n") },
      needs_input: questions.length > 0,
    },
    assumptions,
    questions,
  };
}

/** Derives carbohydrate ranges only from verified rows; a missing row is a question, never a guess. */
export function calculateNutrition(
  components: NutritionComponentInput[],
  entries: FoodNutritionEntry[],
): NutritionEstimate {
  if (components.length === 0) {
    return { components: [], total_carbs_g: null, assumptions: [], questions: [], ready: false };
  }

  const calculations = components.map((component) => calculateComponent(component, entries));
  const results = calculations.map((item) => item.result);
  const complete = results.every((component) => component.carbs_g !== null);
  const total = complete
    ? results.reduce<Range>((sum, component) => ({
      low: sum.low + component.carbs_g!.low,
      high: sum.high + component.carbs_g!.high,
    }), { low: 0, high: 0 })
    : null;

  return {
    components: results,
    total_carbs_g: total,
    assumptions: [...new Set(calculations.flatMap((item) => item.assumptions))],
    questions: calculations.flatMap((item) => item.questions),
    ready: complete,
  };
}
