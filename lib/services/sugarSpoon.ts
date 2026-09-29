import { GRAMS_PER_SPOON } from "./nutritionConfig";
import type { Range } from "./nutrition";

function roundOutward(value: number, direction: "down" | "up"): number {
  const scaled = value * 10;
  return (direction === "down" ? Math.floor(scaled + Number.EPSILON) : Math.ceil(scaled - Number.EPSILON)) / 10;
}

/** Converts a carbohydrate range to a spoon range, rounded outward to one decimal place. */
export function toSugarSpoonRange(carbohydrates: Range): Range {
  if (
    !Number.isFinite(carbohydrates.low) || !Number.isFinite(carbohydrates.high) ||
    carbohydrates.low < 0 || carbohydrates.high < carbohydrates.low
  ) throw new Error("A valid carbohydrate range is required.");

  return {
    low: roundOutward(carbohydrates.low / GRAMS_PER_SPOON, "down"),
    high: roundOutward(carbohydrates.high / GRAMS_PER_SPOON, "up"),
  };
}

/** Shared display formatter for ranges, so numeric carbs are not rendered as single values. */
export function formatRange(range: Range, unit: "g" | "spoons"): string {
  const display = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
  return `${display(range.low)}–${display(range.high)} ${unit}`;
}
