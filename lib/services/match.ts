import { DishIngredient, Flag } from "../types";
import { questionFor } from "./questions";
export function matchIngredients(ingredients: DishIngredient[], allergens: string[]): Flag[] { return ingredients.filter((item) => item.allergenCategory !== "none" && allergens.includes(item.allergenCategory)).map((item) => ({ allergen: item.allergenCategory, ingredient: item.ingredient, tier: item.tier, regionalNote: item.regionalNote, question: questionFor(item.ingredient, item.tier) })); }
