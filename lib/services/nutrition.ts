import type { DishIngredient } from "../types";

export interface NutritionCue {
  label: string;
  detail: string;
}

export interface NutritionNotes {
  cues: NutritionCue[];
  tips: string[];
}

const groups: { label: string; detail: string; terms: string[] }[] = [
  { label: "Carbohydrate cue", detail: "A listed staple may contribute carbohydrates; its share depends on the recipe and portion.", terms: ["rice", "yam", "cassava", "plantain", "maize", "corn", "garri", "fufu", "swallow", "semolina", "bread", "potato", "cocoyam"] },
  { label: "Protein cue", detail: "A listed ingredient may contribute protein; the amount depends on the recipe and portion.", terms: ["bean", "egusi", "melon seed", "fish", "shrimp", "crayfish", "meat", "beef", "chicken", "turkey", "egg", "milk", "lentil", "soy"] },
  { label: "Fat cue", detail: "An oil, seed, or fatty ingredient is listed; type and amount can vary between cooks.", terms: ["oil", "egusi", "melon seed", "groundnut", "peanut", "butter", "palm kernel", "coconut"] },
  { label: "Vegetable cue", detail: "Vegetables or leafy greens appear in the possible ingredient list.", terms: ["leaf", "spinach", "ugu", "greens", "tomato", "pepper", "onion", "okra", "cabbage", "carrot"] },
];

export function getNutritionNotes(ingredients: DishIngredient[]): NutritionNotes {
  const names = ingredients.map((item) => item.ingredient.toLowerCase());
  const cues = groups.filter((group) => names.some((name) => group.terms.some((term) => name.includes(term))))
    .map(({ label, detail }) => ({ label, detail }));
  const hasVegetable = cues.some((cue) => cue.label === "Vegetable cue");
  const tips = [
    "Recipe ratios, cooking oil, and serving size can change a meal's energy and macronutrients substantially.",
    ...(hasVegetable ? [] : ["If available, add leafy vegetables or another produce side to bring more variety to the meal."]),
    "Pairing different food groups across meals is a useful general approach; choose portions that fit your needs and appetite.",
  ];
  return { cues, tips };
}
