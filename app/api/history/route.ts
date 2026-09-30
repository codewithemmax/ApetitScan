import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { DISCLAIMER_TEXT } from "../../../lib/services/nutritionConfig";

function nullableRange(low: unknown, high: unknown): { low: number; high: number } | null {
  if (typeof low !== "number" || typeof high !== "number" ||
    !Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < low) return null;
  return { low, high };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in to view scan history." }, { status: 401 });
  const { data, error } = await supabase.from("scans")
    .select("id,status,components,meal_impact,carbs_low_g,carbs_high_g,spoons_low,spoons_high,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "We could not load your scan history." }, { status: 500 });
  const scans = (data ?? []).map((scan) => ({
    id: scan.id,
    status: scan.status,
    meal_name: Array.isArray(scan.components)
      ? scan.components.flatMap((component) => typeof component === "object" && component !== null &&
        "food" in component && typeof component.food === "string" ? [component.food] : []).join(" · ") || null
      : null,
    meal_impact: scan.meal_impact,
    total_carbs_g: nullableRange(scan.carbs_low_g, scan.carbs_high_g),
    sugar_spoons: nullableRange(scan.spoons_low, scan.spoons_high),
    created_at: scan.created_at,
  }));
  return NextResponse.json({ scans, disclaimer: DISCLAIMER_TEXT });
}
