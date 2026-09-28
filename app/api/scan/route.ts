import { NextResponse } from "next/server";
import { identifyDish, type ImageInput } from "../../../lib/ai/identifyDish";
import { createClient } from "../../../lib/supabase/server";
import type { DishIngredient } from "../../../lib/types";
import { matchIngredients } from "../../../lib/services/match";

interface CachedIngredient {
  ingredient: string;
  tier: DishIngredient["tier"];
  allergen_category: string;
  regional_note: string | null;
}

interface CachedDish {
  dish_name: string;
  verified: boolean;
  dish_ingredients: CachedIngredient[];
}

function isCachedDish(value: unknown): value is CachedDish {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.dish_name === "string" && candidate.verified === true && Array.isArray(candidate.dish_ingredients);
}

function toIngredients(dish: CachedDish): DishIngredient[] {
  return dish.dish_ingredients.map((item) => ({
    ingredient: item.ingredient,
    tier: item.tier,
    allergenCategory: item.allergen_category,
    regionalNote: item.regional_note ?? undefined,
  }));
}

async function readImage(form: FormData): Promise<ImageInput> {
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) throw new Error("Please attach a meal image.");
  const bytes = await file.arrayBuffer();
  return { base64: Buffer.from(bytes).toString("base64"), mimeType: file.type || "image/jpeg" };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Please log in before scanning a dish." }, { status: 401 });

  try {
    const form = await request.formData();
    const image = await readImage(form);
    const selectedDish = form.get("dish");
    let dishName: string;
    let ingredients: DishIngredient[];
    let source: "cache" | "llm_fallback";
    const rawAllergens = form.get("allergens");
    let allergens: string[] = [];
    if (typeof rawAllergens === "string") {
      try {
        const parsed = JSON.parse(rawAllergens) as unknown;
        if (Array.isArray(parsed)) allergens = parsed.filter((item): item is string => typeof item === "string");
      } catch { /* Matching is optional for callers that only need identification. */ }
    }

    const { data: cacheData, error: cacheError } = typeof selectedDish === "string" && selectedDish && !selectedDish.includes("Estimated")
      ? await supabase.from("dish_cache").select("dish_name, verified, dish_ingredients(ingredient, tier, allergen_category, regional_note)").eq("dish_name", selectedDish).eq("verified", true).maybeSingle()
      : { data: null, error: null };

    if (cacheError) {
      console.error("dish_cache lookup failed", cacheError);
      return NextResponse.json({ error: "We could not check the verified dish library." }, { status: 500 });
    }

    if (isCachedDish(cacheData)) {
      dishName = cacheData.dish_name;
      ingredients = toIngredients(cacheData);
      source = "cache";
    } else {
      const identified = await identifyDish(image);
      dishName = identified.dishName;
      ingredients = identified.ingredients;
      source = "llm_fallback";
    }

    const imageUrl = form.get("imageUrl");
    const flags = matchIngredients(ingredients, allergens);
    const { data: savedScan, error: scanError } = await supabase.from("scans").insert({
      user_id: user.id,
      image_url: typeof imageUrl === "string" && imageUrl ? imageUrl : null,
      matched_dish: dishName,
      flags,
      ingredients,
      source,
    }).select("id").single();
    if (scanError) {
      console.error("scan history insert failed", scanError);
      return NextResponse.json({ error: "The dish was identified, but we could not save this scan." }, { status: 500 });
    }

    return NextResponse.json({ scanId: savedScan?.id, dishName, ingredients, source, flags });
  } catch (error) {
    console.error("scan failed", error);
    return NextResponse.json({ error: "We could not identify that dish. Please try again." }, { status: 400 });
  }
}
