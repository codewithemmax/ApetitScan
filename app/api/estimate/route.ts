import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import type { MealComponentCategory } from "../../../lib/services/mealImpact";
import {
  type FoodNutritionEntry,
  type PortionGuess,
} from "../../../lib/services/nutrition";
import { DISCLAIMER_TEXT } from "../../../lib/services/nutritionConfig";
import { buildEstimateResult } from "../../../lib/services/estimateResult";

const PORTIONS = new Set<PortionGuess>(["small", "medium", "large", "uncertain"]);
const CATEGORIES = new Set<MealComponentCategory>(["carb_staple", "protein", "vegetable", "stew_soup", "other"]);

interface EstimateComponentRequest {
  component_id: string;
  food: string;
  food_confirmed: boolean;
  portion: PortionGuess;
  portion_confirmed: boolean;
  preparation: string | null;
  preparation_confirmed: boolean;
}

interface EstimateRequest {
  scan_id: string;
  components: EstimateComponentRequest[];
}

interface StoredScanComponent {
  component_id: string;
  food: string;
  confidence: { food: number; portion: number; preparation: number };
  requires_confirmation: { food: boolean; portion: boolean; preparation: boolean };
}

interface VerifiedFood {
  id: string;
  name: string;
  category: MealComponentCategory;
  is_main_carb: boolean;
  verified: true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function parseEstimateRequest(value: unknown): EstimateRequest | null {
  if (!isRecord(value) || typeof value.scan_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.scan_id) ||
    !Array.isArray(value.components) || value.components.length === 0 || value.components.length > 20) return null;

  const components: EstimateComponentRequest[] = [];
  const ids = new Set<string>();
  for (const item of value.components) {
    if (!isRecord(item) || typeof item.component_id !== "string" || !item.component_id || ids.has(item.component_id) ||
      typeof item.food !== "string" || !item.food.trim() || item.food.length > 100 ||
      typeof item.portion !== "string" || !PORTIONS.has(item.portion as PortionGuess) ||
      !(item.preparation === null || (typeof item.preparation === "string" && item.preparation.length <= 60)) ||
      typeof item.food_confirmed !== "boolean" || typeof item.portion_confirmed !== "boolean" ||
      typeof item.preparation_confirmed !== "boolean") return null;

    ids.add(item.component_id);
    components.push({
      component_id: item.component_id,
      food: item.food.trim(),
      food_confirmed: item.food_confirmed,
      portion: item.portion as PortionGuess,
      portion_confirmed: item.portion_confirmed,
      preparation: item.preparation?.trim() || null,
      preparation_confirmed: item.preparation_confirmed,
    });
  }
  return { scan_id: value.scan_id, components };
}

function parseStoredComponents(value: unknown): StoredScanComponent[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const parsed: StoredScanComponent[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.component_id !== "string" || typeof item.food !== "string" ||
      !isRecord(item.confidence) || !isRecord(item.requires_confirmation)) return null;
    const scores = [item.confidence.food, item.confidence.portion, item.confidence.preparation];
    const flags = [item.requires_confirmation.food, item.requires_confirmation.portion, item.requires_confirmation.preparation];
    if (!scores.every((score) => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100) ||
      !flags.every((flag) => typeof flag === "boolean")) return null;
    parsed.push({
      component_id: item.component_id,
      food: item.food,
      confidence: {
        food: item.confidence.food as number,
        portion: item.confidence.portion as number,
        preparation: item.confidence.preparation as number,
      },
      requires_confirmation: {
        food: item.requires_confirmation.food as boolean,
        portion: item.requires_confirmation.portion as boolean,
        preparation: item.requires_confirmation.preparation as boolean,
      },
    });
  }
  return parsed;
}

function parseVerifiedFoods(value: unknown): VerifiedFood[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item): VerifiedFood[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" ||
      typeof item.category !== "string" || !CATEGORIES.has(item.category as MealComponentCategory) ||
      typeof item.is_main_carb !== "boolean" || item.verified !== true) return [];
    return [{
      id: item.id,
      name: item.name,
      category: item.category as MealComponentCategory,
      is_main_carb: item.is_main_carb,
      verified: true,
    }];
  });
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNutritionRows(value: unknown, foods: VerifiedFood[]): FoodNutritionEntry[] | null {
  if (!Array.isArray(value)) return null;
  const byId = new Map(foods.map((food) => [food.id, food]));
  const entries: FoodNutritionEntry[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.food_id !== "string" || typeof item.preparation !== "string" ||
      typeof item.portion_size !== "string" || typeof item.source_note !== "string") continue;
    const food = byId.get(item.food_id);
    const low = finiteNumber(item.carbs_low_g);
    const high = finiteNumber(item.carbs_high_g);
    const entryConfidence = finiteNumber(item.entry_confidence);
    if (!food || !["small", "medium", "large"].includes(item.portion_size) || low === null || high === null ||
      entryConfidence === null || low < 0 || high < low || entryConfidence < 0 || entryConfidence > 100 || !item.source_note.trim()) continue;
    entries.push({
      food: food.name,
      verified: food.verified,
      preparation: item.preparation,
      portion_size: item.portion_size as "small" | "medium" | "large",
      carbs_low_g: low,
      carbs_high_g: high,
      source_note: item.source_note,
      entry_confidence: entryConfidence,
    });
  }
  return entries;
}

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return response({ error: "Please log in to estimate this meal." }, 401);

  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return response({ error: "Send a JSON body with scan_id and confirmed components." }, 400);
  }
  const input = parseEstimateRequest(body);
  if (!input) return response({ error: "The scan ID or component confirmations are invalid." }, 400);

  const { data: rawScan, error: scanError } = await supabase
    .from("scans")
    .select("id,status,components")
    .eq("id", input.scan_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (scanError) return response({ error: "We could not load this scan." }, 500);
  if (!rawScan) return response({ error: "Scan not found." }, 404);

  const storedComponents = parseStoredComponents(rawScan.components as unknown);
  if (!storedComponents) return response({ error: "This scan has no usable identified components." }, 409);
  const storedById = new Map(storedComponents.map((component) => [component.component_id, component]));
  if (input.components.length !== storedComponents.length || input.components.some((component) => !storedById.has(component.component_id))) {
    return response({ error: "Confirm every component from this scan; components cannot be added or removed here." }, 400);
  }

  const { data: rawFoods, error: foodsError } = await supabase
    .from("foods")
    .select("id,name,category,is_main_carb,verified")
    .eq("verified", true);
  if (foodsError) return response({ error: "We could not load verified food entries." }, 503);
  const foods = parseVerifiedFoods(rawFoods as unknown);
  if (!foods) return response({ error: "The verified food list is invalid." }, 503);

  const { data: rawNutrition, error: nutritionError } = foods.length > 0
    ? await supabase.from("food_nutrition")
      .select("food_id,preparation,portion_size,carbs_low_g,carbs_high_g,source_note,entry_confidence")
      .in("food_id", foods.map((food) => food.id))
    : { data: [], error: null };
  if (nutritionError) return response({ error: "We could not load verified nutrition entries." }, 503);
  const entries = parseNutritionRows(rawNutrition as unknown, foods);
  if (!entries) return response({ error: "Verified nutrition entries are invalid." }, 503);

  const verifiedFoods = foods.filter((food) => entries.some((entry) => normalize(entry.food) === normalize(food.name)));
  const foodOptions = verifiedFoods.map((food) => food.name);
  const mainCarbOptions = verifiedFoods.filter((food) => food.is_main_carb).map((food) => food.name);

  const needsFoodConfirmation = input.components.filter((component) => {
    const stored = storedById.get(component.component_id)!;
    return (stored.requires_confirmation.food || normalize(component.food) !== normalize(stored.food)) && !component.food_confirmed;
  });
  if (needsFoodConfirmation.length > 0) {
    return response({
      scan_id: input.scan_id,
      status: "needs_input",
      questions: needsFoodConfirmation.map((component) => {
        const stored = storedById.get(component.component_id)!;
        const unknown = ["unidentified food", "unknown food", "unknown", "unidentified"].includes(normalize(stored.food));
        return {
          component_id: component.component_id,
          step: unknown ? "main_carbohydrate" : "food",
          prompt: unknown ? "I couldn't identify this dish. What's the main carbohydrate?" : "Please confirm or correct this food.",
          options: unknown ? mainCarbOptions : foodOptions,
        };
      }),
    }, 409);
  }

  const matchedFoods = new Map<string, VerifiedFood>();
  for (const component of input.components) {
    const food = verifiedFoods.find((candidate) => normalize(candidate.name) === normalize(component.food));
    if (food) matchedFoods.set(component.component_id, food);
  }
  const unmatched = input.components.filter((component) => !matchedFoods.has(component.component_id));
  if (unmatched.length > 0) {
    return response({
      scan_id: input.scan_id,
      status: "needs_input",
      questions: unmatched.map((component) => ({
        component_id: component.component_id,
        step: "food",
        prompt: "No verified nutrition entry matches this food. Please choose a listed food.",
        options: foodOptions,
      })),
    }, 200);
  }

  const estimateResult = buildEstimateResult(input.components, storedComponents, matchedFoods, entries);
  const currentComponents = estimateResult.components;

  if (!estimateResult.ready) {
    const { data: updatedScan, error: updateError } = await supabase.from("scans").update({
      status: "needs_input",
      components: currentComponents,
      carbs_low_g: null,
      carbs_high_g: null,
      spoons_low: null,
      spoons_high: null,
      meal_impact: null,
      confidence_overall: null,
      confidence_breakdown: null,
    }).eq("id", input.scan_id).eq("user_id", user.id).select("id").maybeSingle();
    if (updateError || !updatedScan) return response({ error: "We couldn't save the clarification needed for this estimate." }, 500);
    return response({
      scan_id: input.scan_id,
      status: "needs_input",
      components: currentComponents,
      questions: estimateResult.questions,
      assumptions: estimateResult.assumptions,
      disclaimer: DISCLAIMER_TEXT,
    });
  }

  const status = estimateResult.questions.length > 0 ? "needs_input" : "complete";

  const { data: updatedScan, error: updateError } = await supabase.from("scans").update({
    status,
    components: currentComponents,
    carbs_low_g: estimateResult.total_carbs_g.low,
    carbs_high_g: estimateResult.total_carbs_g.high,
    spoons_low: estimateResult.sugar_spoons.low,
    spoons_high: estimateResult.sugar_spoons.high,
    meal_impact: estimateResult.meal_impact,
    confidence_overall: Math.round(estimateResult.confidence.overall),
    confidence_breakdown: estimateResult.confidence,
  }).eq("id", input.scan_id).eq("user_id", user.id).select("id").maybeSingle();
  if (updateError || !updatedScan) return response({ error: "We couldn't save this estimate." }, 500);

  return response({
    scan_id: input.scan_id,
    status,
    components: currentComponents,
    total_carbs_g: estimateResult.total_carbs_g,
    sugar_spoons: estimateResult.sugar_spoons,
    meal_impact: estimateResult.meal_impact,
    confidence: estimateResult.confidence,
    drivers: estimateResult.drivers,
    assumptions: estimateResult.assumptions,
    questions: estimateResult.questions,
    range_straddles_band: estimateResult.range_straddles_band,
    boundary_note: estimateResult.boundary_note,
    disclaimer: DISCLAIMER_TEXT,
  });
}
