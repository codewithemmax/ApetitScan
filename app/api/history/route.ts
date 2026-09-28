import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to view scan history." }, { status: 401 });
  const { data, error } = await supabase.from("scans").select("id, matched_dish, flags, ingredients, source, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "We could not load your scan history." }, { status: 500 });
  return NextResponse.json({ scans: data ?? [] });
}
