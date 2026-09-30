import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { DISCLAIMER_TEXT } from "../../../../lib/services/nutritionConfig";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in to view this scan." }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("scans")
    .select("id,status,components,meal_impact,carbs_low_g,carbs_high_g,spoons_low,spoons_high,confidence_breakdown,meal_prepared,buffer_actions,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "We could not load that scan." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  const range = (low: number | null, high: number | null) =>
    low !== null && high !== null && Number.isFinite(low) && Number.isFinite(high) && low >= 0 && high >= low
      ? { low, high }
      : null;
  return NextResponse.json({
    scan: {
      id: data.id,
      status: data.status,
      components: data.components,
      meal_impact: data.meal_impact,
      total_carbs_g: range(data.carbs_low_g, data.carbs_high_g),
      sugar_spoons: range(data.spoons_low, data.spoons_high),
      confidence: data.confidence_breakdown,
      meal_prepared: data.meal_prepared,
      buffer_actions: data.buffer_actions,
      created_at: data.created_at,
    },
    disclaimer: DISCLAIMER_TEXT,
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in to delete a scan." }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("scans").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "We could not delete that scan." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  return NextResponse.json({ deleted: true, id: data.id });
}
