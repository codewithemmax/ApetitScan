import { Tier } from "../types";
export function questionFor(ingredient: string, tier: Tier): string { if (tier === "always") return `Was ${ingredient} used in this dish?`; if (tier === "commonly") return `Does this batch include ${ingredient}?`; return `Could you please tell me if ${ingredient} was added?`; }
