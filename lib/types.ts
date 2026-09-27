export type Tier = "always" | "commonly" | "sometimes";
export type Source = "cache" | "llm_fallback";
export interface DishIngredient { ingredient: string; tier: Tier; allergenCategory: string; regionalNote?: string; }
export interface Dish { dishName: string; verified: boolean; ingredients: DishIngredient[]; }
export interface AllergyProfile { id: string; name: string; note: string; allergens: string[]; }
export interface Flag { allergen: string; ingredient: string; tier: Tier; question: string; regionalNote?: string; }
export interface ScanResult { dishName: string; source: Source; ingredients: DishIngredient[]; flags: Flag[]; }
