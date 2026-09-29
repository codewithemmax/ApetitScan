import { NextResponse } from "next/server";
import { buildEstimateResult, type EstimateRequestComponent, type EstimateStoredComponent, type EstimateFood } from "../../../lib/services/estimateResult";
import type { MealComponentCategory } from "../../../lib/services/mealImpact";
import type { FoodNutritionEntry, PortionGuess } from "../../../lib/services/nutrition";
import { createClient } from "../../../lib/supabase/server";

const PORTIONS = new Set<PortionGuess>(["small", "medium", "large", "uncertain"]);
const CATEGORIES = new Set<MealComponentCategory>(["carb_staple", "protein", "vegetable", "stew_soup", "other"]);
const STEPS = new Set(["food", "portion", "preparation", "main_carbohydrate"]);
type CorrectionStep = "food" | "portion" | "preparation" | "main_carbohydrate";
interface VerifiedFood extends EstimateFood { is_main_carb: boolean; }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStoredComponents(value: unknown): EstimateStoredComponent[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const result: EstimateStoredComponent[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.component_id !== "string" || !item.component_id || typeof item.food !== "string" ||
      !isRecord(item.confidence) || !isRecord(item.requires_confirmation)) return null;
    const scores = [item.confidence.food, item.confidence.portion, item.confidence.preparation];
    const flags = [item.requires_confirmation.food, item.requires_confirmation.portion, item.requires_confirmation.preparation];
    if (!scores.every((score) => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100) ||
      !flags.every((flag) => typeof flag === "boolean")) return null;
    result.push({
      component_id: item.component_id,
      food: item.food,
      confidence: { food: scores[0] as number, portion: scores[1] as number, preparation: scores[2] as number },
      requires_confirmation: { food: flags[0] as boolean, portion: flags[1] as boolean, preparation: flags[2] as boolean },
    });
  }
  return result;
}

function parseFoods(value: unknown): VerifiedFood[] | null {
  if (!Array.isArray(value)) return null;
  const parsed: VerifiedFood[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" ||
      typeof item.category !== "string" || !CATEGORIES.has(item.category as MealComponentCategory) ||
      typeof item.is_main_carb !== "boolean" || item.verified !== true) continue;
    parsed.push({ id: item.id, name: item.name, category: item.category as MealComponentCategory, is_main_carb: item.is_main_carb });
  }
  return parsed;
}

function parseNutritionRows(value: unknown, foods: EstimateFood[]): FoodNutritionEntry[] | null {
  if (!Array.isArray(value)) return null;
  const byId = new Map(foods.map((food) => [food.id, food]));
  const entries: FoodNutritionEntry[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.food_id !== "string" || typeof item.preparation !== "string" ||
      typeof item.portion_size !== "string" || typeof item.source_note !== "string") continue;
    const food = byId.get(item.food_id);
    const low = finiteNumber(item.carbs_low_g);
    const high = finiteNumber(item.carbs_high_g);
    const confidence = finiteNumber(item.entry_confidence);
    if (!food || !["small", "medium", "large"].includes(item.portion_size) || low === null || high === null ||
      confidence === null || low < 0 || high < low || confidence < 0 || confidence > 100 || !item.source_note.trim()) continue;
    entries.push({
      food: food.name,
      verified: true,
      preparation: item.preparation,
      portion_size: item.portion_size as "small" | "medium" | "large",
      carbs_low_g: low,
      carbs_high_g: high,
      source_note: item.source_note,
      entry_confidence: confidence,
    });
  }
  return entries;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in to correct this scan." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Send scan_id, component_id, step, and corrected in JSON." }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.scan_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.scan_id) ||
    typeof body.component_id !== "string" || !body.component_id || body.component_id.length > 100 ||
    typeof body.step !== "string" || !STEPS.has(body.step) || typeof body.corrected !== "string" || !body.corrected.trim() || body.corrected.length > 100) {
    return NextResponse.json({ error: "The scan or correction fields are invalid." }, { status: 400 });
  }
  const step = body.step as CorrectionStep;
  const corrected = body.corrected.trim();
  const { data: rawScan, error: scanError } = await supabase.from("scans")
    .select("id,status,components")
    .eq("id", body.scan_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (scanError) return NextResponse.json({ error: "We could not load this scan." }, { status: 500 });
  if (!rawScan) return NextResponse.json({ error: "Scan not found." }, { status: 404 });

  const stored = parseStoredComponents(rawScan.components as unknown);
  const storedComponent = stored?.find((component) => component.component_id === body.component_id);
  if (!stored || !storedComponent) return NextResponse.json({ error: "This component is not part of the scan." }, { status: 400 });
  const rawComponents = rawScan.components as unknown[];
  const editable = rawComponents.map((item) => ({ ...(item as Record<string, unknown>) }));
  const index = editable.findIndex((item) => item.component_id === body.component_id);
  const target = editable[index];
  const original = step === "portion" ? target.portion : step === "preparation" ? target.preparation : target.food;

  if (step === "portion") {
    if (!PORTIONS.has(corrected as PortionGuess) || corrected === "uncertain") {
      return NextResponse.json({ error: "Choose small, medium, or large for the corrected portion." }, { status: 400 });
    }
    target.portion = corrected;
    target.portion_confirmed = true;
  } else if (step === "preparation") {
    target.preparation = corrected;
    target.preparation_confirmed = true;
  }

  const { data: rawFoods, error: foodsError } = await supabase.from("foods")
    .select("id,name,category,is_main_carb,verified")
    .eq("verified", true);
  if (foodsError) return NextResponse.json({ error: "We could not load verified foods." }, { status: 503 });
  const parsedFoods = parseFoods(rawFoods as unknown);
  if (!parsedFoods) return NextResponse.json({ error: "The verified food list is invalid." }, { status: 503 });
  const verifiedFoods = parsedFoods;
  const food = verifiedFoods.find((item) => normalize(item.name) === normalize(corrected));
  if ((step === "food" || step === "main_carbohydrate") && (!food || (step === "main_carbohydrate" && !food.is_main_carb))) {
    return NextResponse.json({ error: step === "main_carbohydrate" ? "Choose a verified main carbohydrate." : "Choose a food from the verified catalogue." }, { status: 400 });
  }
  if (step === "food" || step === "main_carbohydrate") {
    target.food = food!.name;
    target.food_id = food!.id;
    target.category = food!.category;
    target.food_verified = true;
    target.food_confirmed = true;
    target.requires_confirmation = { ...(isRecord(target.requires_confirmation) ? target.requires_confirmation : {}), food: false };
  }

  const { data: rawNutrition, error: nutritionError } = verifiedFoods.length > 0
    ? await supabase.from("food_nutrition").select("food_id,preparation,portion_size,carbs_low_g,carbs_high_g,source_note,entry_confidence").in("food_id", verifiedFoods.map((item) => item.id))
    : { data: [], error: null };
  if (nutritionError) return NextResponse.json({ error: "We could not load verified nutrition entries." }, { status: 503 });
  const entries = parseNutritionRows(rawNutrition as unknown, verifiedFoods);
  if (!entries) return NextResponse.json({ error: "Verified nutrition entries are invalid." }, { status: 503 });
  if (step === "preparation") {
    const supported = entries.some((entry) => normalize(entry.food) === normalize(String(target.food)) && normalize(entry.preparation) === normalize(corrected));
    if (!supported) return NextResponse.json({ error: "Choose a preparation with a verified nutrition entry for this food." }, { status: 400 });
  }

  const requestComponents: EstimateRequestComponent[] = editable.map((item) => ({
    component_id: String(item.component_id),
    food: String(item.food),
    food_confirmed: item.food_confirmed === true,
    portion: PORTIONS.has(item.portion as PortionGuess) ? item.portion as PortionGuess : "uncertain",
    portion_confirmed: item.portion_confirmed === true,
    preparation: typeof item.preparation === "string" ? item.preparation : null,
    preparation_confirmed: item.preparation_confirmed === true,
  }));
  const matchedFoods = new Map<string, EstimateFood>();
  for (const component of requestComponents) {
    const matched = verifiedFoods.find((candidate) => normalize(candidate.name) === normalize(component.food));
    if (matched) matchedFoods.set(component.component_id, matched);
  }
  const correctionResult = { component_id: body.component_id, step, original: original ?? null, corrected };
  const result = matchedFoods.size === requestComponents.length
    ? buildEstimateResult(requestComponents, stored, matchedFoods, entries)
    : null;
  const status = result?.ready && result.questions.length === 0 ? "complete" : "needs_input";
  const { data: correctionRow, error: correctionError } = await supabase.from("scan_corrections").insert({
    scan_id: body.scan_id,
    user_id: user.id,
    step,
    original: { component_id: body.component_id, value: original ?? null },
    corrected: { component_id: body.component_id, value: corrected },
  }).select("id").single();
  if (correctionError || !correctionRow) return NextResponse.json({ error: "We could not save this correction." }, { status: 500 });

  const update = await supabase.from("scans").update({
    status,
    components: result?.components ?? editable,
    carbs_low_g: result?.ready ? result.total_carbs_g.low : null,
    carbs_high_g: result?.ready ? result.total_carbs_g.high : null,
    spoons_low: result?.ready ? result.sugar_spoons.low : null,
    spoons_high: result?.ready ? result.sugar_spoons.high : null,
    meal_impact: result?.ready ? result.meal_impact : null,
    confidence_overall: result?.ready ? Math.round(result.confidence.overall) : null,
    confidence_breakdown: result?.ready ? result.confidence : null,
  }).eq("id", body.scan_id).eq("user_id", user.id).select("id").maybeSingle();
  if (update.error || !update.data) {
    await supabase.from("scan_corrections").delete().eq("id", correctionRow.id).eq("user_id", user.id);
    return NextResponse.json({ error: "We could not apply this correction to the scan." }, { status: 500 });
  }

  return NextResponse.json({
    correction_id: correctionRow.id,
    scan_id: body.scan_id,
    correction: correctionResult,
    status,
    ...(result?.ready ? {
      components: result.components,
      total_carbs_g: result.total_carbs_g,
      sugar_spoons: result.sugar_spoons,
      meal_impact: result.meal_impact,
      confidence: result.confidence,
      drivers: result.drivers,
      assumptions: result.assumptions,
      questions: result.questions,
      range_straddles_band: result.range_straddles_band,
      boundary_note: result.boundary_note,
      disclaimer: result.disclaimer,
    } : { components: result?.components ?? editable, questions: result?.questions ?? [{ step: "food", prompt: "Choose a verified food for every component." }] }),
  });
}
