export interface MealImageInput {
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export type PortionGuess = "small" | "medium" | "large" | "uncertain";

export interface MealComponentIdentification {
  food: string;
  portion: PortionGuess;
  preparation: string;
  confidence: { food: number; portion: number; preparation: number };
}

export interface IdentifiedMeal {
  components: MealComponentIdentification[];
}

const instruction = `Identify the visible food components in this meal photo. Return only JSON in this shape:
{"components":[{"food":"plain food name","portion":"small|medium|large|uncertain","preparation":"plain preparation name or uncertain","confidence":{"food":0,"portion":0,"preparation":0}}]}

Include separate visible staple foods, proteins, vegetables, and stews or sauces. Use concise food names suitable for matching against a food catalogue. Do not infer hidden ingredients or ingredients mixed into an unidentifiable dish; use "unidentified food" when a component cannot be identified. Estimate portion only as small, medium, large, or uncertain; this is a visual category, not a weight. State preparation only when visually supported; otherwise use "uncertain". Each confidence is an integer from 0 to 100 for that identification step. Return an empty components array only when no food is visible. Do not include nutrition, carbohydrate, calorie, energy, or health-effect information.`;

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const portions = new Set<PortionGuess>(["small", "medium", "large", "uncertain"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function confidence(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

function validateImage(image: MealImageInput): void {
  if (!isRecord(image) || !imageTypes.has(String(image.mimeType))) {
    throw new Error("A JPEG, PNG, or WebP meal image is required.");
  }
  if (
    typeof image.base64 !== "string" || !image.base64 || image.base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)
  ) throw new Error("The meal image data is invalid.");
}

function parseIdentification(value: unknown): IdentifiedMeal {
  let result = value;
  if (typeof result === "string") {
    const json = result.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try { result = JSON.parse(json) as unknown; }
    catch { throw new Error("The vision response was not valid JSON."); }
  }
  if (!isRecord(result) || !Array.isArray(result.components)) {
    throw new Error("The vision response must contain a components array.");
  }
  if (result.components.length > 20) throw new Error("The vision response contained too many components.");

  const components = result.components.map((item, index): MealComponentIdentification => {
    if (!isRecord(item)) throw new Error(`Vision response component ${index + 1} is invalid.`);
    const food = typeof item.food === "string" ? item.food.trim() : "";
    const preparation = typeof item.preparation === "string" ? item.preparation.trim() : "";
    if (!food || food.length > 100) throw new Error(`Vision response component ${index + 1} has an invalid food name.`);
    if (!preparation || preparation.length > 60) throw new Error(`Vision response component ${index + 1} has an invalid preparation guess.`);
    if (typeof item.portion !== "string" || !portions.has(item.portion as PortionGuess)) {
      throw new Error(`Vision response component ${index + 1} has an invalid portion guess.`);
    }
    if (!isRecord(item.confidence) || !confidence(item.confidence.food) || !confidence(item.confidence.portion) || !confidence(item.confidence.preparation)) {
      throw new Error(`Vision response component ${index + 1} has invalid confidence values.`);
    }
    return {
      food,
      portion: item.portion as PortionGuess,
      preparation,
      confidence: {
        food: item.confidence.food,
        portion: item.confidence.portion,
        preparation: item.confidence.preparation,
      },
    };
  });
  return { components };
}

async function responseJson(response: Response, provider: string): Promise<unknown> {
  if (!response.ok) throw new Error(`${provider} returned HTTP ${response.status}.`);
  try { return await response.json() as unknown; }
  catch { throw new Error(`${provider} returned invalid JSON.`); }
}

async function callGemini(image: MealImageInput): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured on the server.");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instruction }, { inlineData: { mimeType: image.mimeType, data: image.base64 } }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await responseJson(response, "Gemini");
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) throw new Error("Gemini returned an unexpected response shape.");
  const candidate = payload.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    throw new Error("Gemini returned no usable identification content.");
  }
  const part = candidate.content.parts.find((value) => isRecord(value) && typeof value.text === "string");
  if (!isRecord(part)) throw new Error("Gemini returned no identification text.");
  return part.text;
}

async function callGroq(image: MealImageInput): Promise<unknown> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured on the server.");
  const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: [
        { type: "text", text: instruction },
        { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
      ] }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await responseJson(response, "Groq");
  if (!isRecord(payload) || !Array.isArray(payload.choices)) throw new Error("Groq returned an unexpected response shape.");
  const choice = payload.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message) || typeof choice.message.content !== "string") {
    throw new Error("Groq returned no usable identification content.");
  }
  return choice.message.content;
}

/** Identifies visible meal components; Gemini is primary and Groq is the fallback. */
export async function identifyMeal(image: MealImageInput): Promise<IdentifiedMeal> {
  validateImage(image);
  try {
    return parseIdentification(await callGemini(image));
  } catch (geminiError) {
    try {
      return parseIdentification(await callGroq(image));
    } catch (groqError) {
      const first = geminiError instanceof Error ? geminiError.message : "request failed";
      const fallback = groqError instanceof Error ? groqError.message : "request failed";
      throw new Error(`Meal identification failed after both vision attempts. ${first} Fallback: ${fallback}`);
    }
  }
}
