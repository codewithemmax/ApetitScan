import { AllergyProfile, Dish } from "./types";
export const profiles: AllergyProfile[] = [
  { id: "ada", name: "Ada", note: "Peanut + shellfish", allergens: ["peanut", "shellfish"] },
  { id: "tunde", name: "Tunde", note: "Dairy + egg", allergens: ["dairy", "egg"] },
  { id: "general", name: "Just exploring", note: "Broad scan", allergens: ["peanut", "shellfish", "dairy", "egg"] }
];
export const dishes: Dish[] = [
  { dishName: "Egusi soup", verified: true, ingredients: [
    { ingredient: "ground egusi (melon seed)", tier: "always", allergenCategory: "none" },
    { ingredient: "palm oil", tier: "commonly", allergenCategory: "none" },
    { ingredient: "leafy greens", tier: "commonly", allergenCategory: "none" },
    { ingredient: "crayfish or dried shrimp", tier: "sometimes", allergenCategory: "shellfish", regionalNote: "Common in many versions, but the cook may use another stock or leave it out." },
    { ingredient: "stockfish or dried fish", tier: "sometimes", allergenCategory: "none", regionalNote: "Fish choices vary by household and region." },
    { ingredient: "seasoning or bouillon", tier: "sometimes", allergenCategory: "none", regionalNote: "Brand and recipe vary; ask the cook which seasoning was used." }
  ] },
  { dishName: "Jollof rice", verified: true, ingredients: [
    { ingredient: "long-grain parboiled rice", tier: "always", allergenCategory: "none" }, { ingredient: "tomato and red pepper stew", tier: "always", allergenCategory: "none" },
    { ingredient: "cooking oil", tier: "commonly", allergenCategory: "none", regionalNote: "Oil type and quantity vary between home and party recipes." }, { ingredient: "onion and seasoning", tier: "commonly", allergenCategory: "none" },
    { ingredient: "broth or bouillon", tier: "sometimes", allergenCategory: "none", regionalNote: "Some recipes use broth or bouillon; others season with water and spices." }
  ] },
  { dishName: "Moin moin", verified: true, ingredients: [
    { ingredient: "steamed blended beans", tier: "always", allergenCategory: "none" }, { ingredient: "pepper and onion", tier: "commonly", allergenCategory: "none" },
    { ingredient: "vegetable oil", tier: "commonly", allergenCategory: "none" }, { ingredient: "crayfish or dried shrimp", tier: "sometimes", allergenCategory: "shellfish", regionalNote: "A common enrichment in many versions, but not used in every batch." },
    { ingredient: "boiled egg filling", tier: "sometimes", allergenCategory: "egg", regionalNote: "Egg is a frequent filling, but other batches use fish, meat, or no filling." }
  ] }
];
export function findDish(name: string): Dish | undefined { return dishes.find((dish) => dish.dishName.toLowerCase() === name.toLowerCase()); }
