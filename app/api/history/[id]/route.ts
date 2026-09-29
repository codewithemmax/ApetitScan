import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to delete a scan." }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("scans").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "We could not delete that scan." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  return NextResponse.json({ deleted: true, id: data.id });
}
