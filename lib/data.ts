import { AllergyProfile, Dish } from "./types";
export const profiles: AllergyProfile[] = [
  { id: "ada", name: "Ada", note: "Peanut + shellfish", allergens: ["peanut", "shellfish"] },
  { id: "tunde", name: "Tunde", note: "Dairy + egg", allergens: ["dairy", "egg"] },
  { id: "general", name: "Just exploring", note: "Broad scan", allergens: ["peanut", "shellfish", "dairy", "egg"] }
];
export const dishes: Dish[] = [
  { dishName: "Egusi soup", verified: true, ingredients: [
    { ingredient: "ground egusi (melon seed)", tier: "always", allergenCategory: "seed" },
    { ingredient: "palm oil", tier: "always", allergenCategory: "none" },
    { ingredient: "leafy greens", tier: "commonly", allergenCategory: "none" },
    { ingredient: "crayfish or dried shrimp", tier: "commonly", allergenCategory: "shellfish", regionalNote: "Some cooks use crayfish; others leave it out." },
    { ingredient: "peanut or groundnut", tier: "sometimes", allergenCategory: "peanut", regionalNote: "Ask whether groundnut was added to thicken or deepen the soup." }
  ] },
  { dishName: "Jollof rice", verified: true, ingredients: [
    { ingredient: "rice", tier: "always", allergenCategory: "none" }, { ingredient: "tomato and pepper base", tier: "always", allergenCategory: "none" },
    { ingredient: "stock cube", tier: "commonly", allergenCategory: "dairy", regionalNote: "Brand and recipe vary; ask which stock was used." }, { ingredient: "egg garnish", tier: "sometimes", allergenCategory: "egg" }
  ] },
  { dishName: "Moin moin", verified: true, ingredients: [
    { ingredient: "blended beans", tier: "always", allergenCategory: "none" }, { ingredient: "palm oil", tier: "commonly", allergenCategory: "none" },
    { ingredient: "boiled egg", tier: "sometimes", allergenCategory: "egg", regionalNote: "Egg is a common filling, but not used in every batch." }, { ingredient: "crayfish", tier: "sometimes", allergenCategory: "shellfish" }
  ] }
];
export function findDish(name: string): Dish | undefined { return dishes.find((dish) => dish.dishName.toLowerCase() === name.toLowerCase()); }
