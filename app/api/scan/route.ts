import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { identifyMeal, type MealComponentIdentification, type PortionGuess } from "../../../lib/ai/identifyMeal";
import { IDENTIFICATION_CONFIRMATION_THRESHOLD } from "../../../lib/services/nutritionConfig";
import { createClient } from "../../../lib/supabase/server";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PORTION_OPTIONS: PortionGuess[] = ["small", "medium", "large"];

type FoodCategory = "carb_staple" | "protein" | "vegetable" | "stew_soup" | "other";

interface FoodCatalogEntry {
  id: string;
  name: string;
  category: FoodCategory;
  is_main_carb: boolean;
  preparations: string[];
}

interface ScanComponent {
  component_id: string;
  food: string;
  food_id: string | null;
  category: FoodCategory | null;
  food_verified: boolean;
  portion: PortionGuess;
  preparation: string;
  confidence: MealComponentIdentification["confidence"];
  food_confirmed: false;
  portion_confirmed: false;
  preparation_confirmed: false;
  requires_confirmation: { food: boolean; portion: boolean; preparation: boolean };
}

interface ScanQuestion {
  component_id: string;
  step: "food" | "portion" | "preparation" | "main_carbohydrate";
  prompt: string;
  options: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function parseFoodRows(value: unknown): FoodCatalogEntry[] {
  if (!Array.isArray(value)) throw new Error("The food catalogue response is invalid.");
  const categories = new Set<FoodCategory>(["carb_staple", "protein", "vegetable", "stew_soup", "other"]);
  return value.flatMap((item): FoodCatalogEntry[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" ||
      typeof item.category !== "string" || !categories.has(item.category as FoodCategory) ||
      typeof item.is_main_carb !== "boolean" || item.verified !== true) return [];
    return [{ id: item.id, name: item.name, category: item.category as FoodCategory, is_main_carb: item.is_main_carb, preparations: [] }];
  });
}

function attachPreparations(foods: FoodCatalogEntry[], value: unknown): FoodCatalogEntry[] {
  if (!Array.isArray(value)) throw new Error("The food preparation catalogue response is invalid.");
  const byId = new Map(foods.map((food) => [food.id, food]));
  for (const item of value) {
    if (!isRecord(item) || typeof item.food_id !== "string" || typeof item.preparation !== "string") continue;
    const food = byId.get(item.food_id);
    if (food && !food.preparations.some((prep) => normalize(prep) === normalize(item.preparation as string))) {
      food.preparations.push(item.preparation.trim());
    }
  }
  return foods.filter((food) => food.preparations.length > 0);
}

function isUnknownFood(food: string): boolean {
  return ["unidentified food", "unknown food", "unknown", "unidentified"].includes(normalize(food));
}

function createPlaceholder(): MealComponentIdentification {
  return {
    food: "unidentified food",
    portion: "uncertain",
    preparation: "uncertain",
    confidence: { food: 0, portion: 0, preparation: 0 },
  };
}

function buildScanComponents(
  identified: MealComponentIdentification[],
  foods: FoodCatalogEntry[],
): { components: ScanComponent[]; questions: ScanQuestion[] } {
  const results = identified.length > 0 ? identified : [createPlaceholder()];
  const components: ScanComponent[] = [];
  const questions: ScanQuestion[] = [];
  const allFoods = foods.map((food) => food.name);
  const mainCarbs = foods.filter((food) => food.is_main_carb).map((food) => food.name);

  for (const candidate of results) {
    const id = randomUUID();
    const match = isUnknownFood(candidate.food)
      ? undefined
      : foods.find((food) => normalize(food.name) === normalize(candidate.food));
    const foodScore = candidate.confidence.food;
    const portionScore = candidate.confidence.portion;
    const preparationScore = candidate.confidence.preparation;
    const normalizedPreparation = normalize(candidate.preparation);
    const preparationMatch = match?.preparations.find((preparation) => normalize(preparation) === normalizedPreparation);
    const foodNeedsConfirmation = !match || foodScore < IDENTIFICATION_CONFIRMATION_THRESHOLD;
    const portionNeedsConfirmation = candidate.portion === "uncertain" || portionScore < IDENTIFICATION_CONFIRMATION_THRESHOLD;
    const preparationNeedsConfirmation = !match || !preparationMatch || normalizedPreparation === "uncertain" ||
      preparationScore < IDENTIFICATION_CONFIRMATION_THRESHOLD;
    const resolved: ScanComponent = {
      component_id: id,
      food: match?.name ?? candidate.food,
      food_id: match?.id ?? null,
      category: match?.category ?? null,
      food_verified: match !== undefined,
      portion: candidate.portion,
      preparation: preparationMatch ?? candidate.preparation,
      confidence: candidate.confidence,
      food_confirmed: false,
      portion_confirmed: false,
      preparation_confirmed: false,
      requires_confirmation: {
        food: foodNeedsConfirmation,
        portion: portionNeedsConfirmation,
        preparation: preparationNeedsConfirmation,
      },
    };
    components.push(resolved);

    if (foodNeedsConfirmation) {
      if (isUnknownFood(candidate.food)) {
        questions.push({
          component_id: id,
          step: "main_carbohydrate",
          prompt: "I couldn't identify this dish. What's the main carbohydrate?",
          options: mainCarbs,
        });
      } else {
        questions.push({
          component_id: id,
          step: "food",
          prompt: "Please confirm or correct this food.",
          options: allFoods,
        });
      }
    }
    if (portionNeedsConfirmation) {
      questions.push({ component_id: id, step: "portion", prompt: "How big was the portion?", options: PORTION_OPTIONS });
    }
    if (preparationNeedsConfirmation && match) {
      questions.push({
        component_id: id,
        step: "preparation",
        prompt: "Which preparation was used?",
        options: match.preparations,
      });
    }
  }

  return { components, questions };
}

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return failure("Please log in to scan a meal.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure("Send the meal photo as multipart form data in the 'image' field.", 400);
  }
  const image = form.get("image");
  if (!(image instanceof File)) return failure("A meal photo is required in the 'image' field.", 400);
  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) return failure("Upload a JPEG, PNG, or WebP meal photo.", 415);
  if (image.size === 0) return failure("The uploaded meal photo is empty.", 400);
  if (image.size > MAX_IMAGE_BYTES) return failure("The meal photo must be 8 MB or smaller.", 413);

  const { data: rawFoods, error: foodError } = await supabase
    .from("foods")
    .select("id,name,category,is_main_carb,verified")
    .eq("verified", true);
  if (foodError) return failure("We could not load the verified food list. Please try again.", 503);

  let foods: FoodCatalogEntry[];
  try {
    foods = parseFoodRows(rawFoods as unknown);
  } catch {
    return failure("The verified food list is unavailable. Please try again.", 503);
  }
  if (foods.length > 0) {
    const { data: rawPreparations, error: preparationError } = await supabase
      .from("food_nutrition")
      .select("food_id,preparation")
      .in("food_id", foods.map((food) => food.id));
    if (preparationError) return failure("We could not load the verified preparation choices. Please try again.", 503);
    try {
      foods = attachPreparations(foods, rawPreparations as unknown);
    } catch {
      return failure("The verified preparation list is unavailable. Please try again.", 503);
    }
  } else {
    foods = [];
  }

  const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  let identified: MealComponentIdentification[];
  try {
    const result = await identifyMeal({
      base64,
      mimeType: image.type as "image/jpeg" | "image/png" | "image/webp",
    });
    identified = result.components;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meal identification failed.";
    const missingKey = message.includes("is not configured on the server");
    return failure(
      missingKey ? "Meal identification is not configured on the server." : "We couldn't identify the meal photo. Please try again with a clear photo.",
      missingKey ? 503 : 502,
    );
  }

  const { components, questions } = buildScanComponents(identified, foods);
  const status = questions.length > 0 ? "needs_input" : "complete";
  const { data: scan, error: insertError } = await supabase
    .from("scans")
    .insert({ user_id: user.id, image_url: null, status, components })
    .select("id,status")
    .single();
  if (insertError || !scan) return failure("We couldn't save this scan. Please try again.", 500);

  return NextResponse.json({ scan_id: scan.id, status, components, questions }, { status: 201 });
}
