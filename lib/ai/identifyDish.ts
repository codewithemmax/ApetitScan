import type { DishIngredient, Tier } from "../types";

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export interface IdentifiedDish {
  dishName: string;
  ingredients: DishIngredient[];
  source: "llm_fallback";
}

const instruction = `Identify the Nigerian dish in the image and return only valid JSON with this shape:
{"dishName":"string","ingredients":[{"ingredient":"string","tier":"always|commonly|sometimes","allergenCategory":"peanut|shellfish|dairy|egg|gluten|none","regionalNote":"string or empty"}]}

Use cautious recipe language. The tiers mean: always is present in essentially every version, commonly is present in most versions, and sometimes is present in some household or regional versions. Do not make medical claims. Do not claim certainty about a specific plate. Include a plain-language regional note when recipe variation matters.`;

const tiers: Tier[] = ["always", "commonly", "sometimes"];
const allergenCategories = new Set(["peanut", "shellfish", "dairy", "egg", "gluten", "none"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseDish(value: unknown): Omit<IdentifiedDish, "source"> {
  let candidate = value;
  if (typeof candidate === "string") {
    const cleaned = candidate.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    candidate = JSON.parse(cleaned) as unknown;
  }
  if (!isRecord(candidate)) throw new Error("The vision response was not an object.");
  const dishName = text(candidate.dishName);
  const rawIngredients = Array.isArray(candidate.ingredients) ? candidate.ingredients : [];
  if (!dishName || rawIngredients.length === 0) throw new Error("The vision response did not identify ingredients.");

  const ingredients = rawIngredients.flatMap((item): DishIngredient[] => {
    if (!isRecord(item)) return [];
    const ingredient = text(item.ingredient);
    const tier = item.tier;
    const allergenCategory = text(item.allergenCategory);
    if (!ingredient || typeof tier !== "string" || !tiers.includes(tier as Tier) || !allergenCategory || !allergenCategories.has(allergenCategory)) return [];
    return [{ ingredient, tier: tier as Tier, allergenCategory, regionalNote: text(item.regionalNote) }];
  });
  if (ingredients.length === 0) throw new Error("The vision response contained no valid ingredient rows.");
  return { dishName, ingredients };
}

function required(name: "GEMINI_API_KEY" | "GROQ_API_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured on the server.`);
  return value;
}

async function identifyWithGemini(image: ImageInput): Promise<Omit<IdentifiedDish, "source">> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": required("GEMINI_API_KEY") },
    body: JSON.stringify({ contents: [{ parts: [{ text: instruction }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }] }], generationConfig: { responseMimeType: "application/json" } }),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const payload = await response.json() as unknown;
  if (!isRecord(payload)) throw new Error("Gemini returned an invalid response.");
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = candidates[0];
  if (!isRecord(first) || !isRecord(first.content) || !Array.isArray(first.content.parts)) throw new Error("Gemini returned no content.");
  const part = first.content.parts[0];
  if (!isRecord(part)) throw new Error("Gemini returned an invalid content part.");
  return parseDish(part.text);
}

async function identifyWithGroq(image: ImageInput): Promise<Omit<IdentifiedDish, "source">> {
  const model = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${required("GROQ_API_KEY")}` },
    body: JSON.stringify({ model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: instruction }, { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } }] }] }),
  });
  if (!response.ok) throw new Error(`Groq returned ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const payload = await response.json() as unknown;
  if (!isRecord(payload) || !Array.isArray(payload.choices)) throw new Error("Groq returned an invalid response.");
  const first = payload.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) throw new Error("Groq returned no message.");
  return parseDish(first.message.content);
}

export async function identifyDish(image: ImageInput): Promise<IdentifiedDish> {
  try {
    return { ...(await identifyWithGemini(image)), source: "llm_fallback" };
  } catch (geminiError) {
    try {
      return { ...(await identifyWithGroq(image)), source: "llm_fallback" };
    } catch (groqError) {
      const geminiMessage = geminiError instanceof Error ? geminiError.message : "Gemini failed.";
      const groqMessage = groqError instanceof Error ? groqError.message : "Groq failed.";
      throw new Error(`Dish identification failed after both providers. ${geminiMessage} ${groqMessage}`);
    }
  }
}
