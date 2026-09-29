import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

interface BufferAction {
  rank: number;
  group: "Prepare" | "Adjust" | "Recover";
  title: string;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function actionsFor(mealPrepared: boolean, components: unknown[]): BufferAction[] {
  const actions: Omit<BufferAction, "rank">[] = [];
  const mainCarbohydrate = components.find((component) => isRecord(component) && component.category === "carb_staple" && typeof component.food === "string");
  const staple = isRecord(mainCarbohydrate) && typeof mainCarbohydrate.food === "string" ? mainCarbohydrate.food : "main carbohydrate";
  if (!mealPrepared) {
    actions.push({
      group: "Prepare",
      title: "Choose a portion that feels comfortable",
      description: "If you have not served the meal yet, start with a smaller serving of the main carbohydrate and add more if you want it.",
    });
  } else {
    actions.push({
      group: "Adjust",
      title: `Serve a smaller ${staple} portion`,
      description: `If ${staple} is on the plate, you can set some aside and keep the rest of the meal as prepared.`,
    });
  }
  actions.push({
    group: "Adjust",
    title: "Add vegetables or protein if available",
    description: "Add them alongside what is already made, if they are available and suit the meal.",
  });
  if (!mealPrepared) {
    actions.push({
      group: "Prepare",
      title: "Choose how to prepare the meal",
      description: "If cooking has not started, consider a boiled, steamed, or grilled preparation where it fits the dish.",
    });
  }
  actions.push(
    {
      group: "Recover",
      title: "Consider light activity after eating",
      description: "A gentle walk or other comfortable movement is an optional way to return to your usual routine.",
    },
    {
      group: "Recover",
      title: "Keep this meal in mind next time",
      description: "Use the meal details as a reference when planning a future serving; no change is required now.",
    },
  );
  return actions.map((action, index) => ({ ...action, rank: index + 1 }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please log in to get meal suggestions." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Send a JSON body with scan_id and meal_prepared." }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.scan_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.scan_id) ||
    typeof body.meal_prepared !== "boolean") {
    return NextResponse.json({ error: "The scan ID or meal_prepared value is invalid." }, { status: 400 });
  }

  const { data: scan, error: scanError } = await supabase.from("scans")
    .select("id,status,carbs_low_g,carbs_high_g,components")
    .eq("id", body.scan_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (scanError) return NextResponse.json({ error: "We could not load this scan." }, { status: 500 });
  if (!scan) return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  if (scan.status !== "complete" || scan.carbs_low_g === null || scan.carbs_high_g === null || !Array.isArray(scan.components)) {
    return NextResponse.json({ error: "Estimate this meal before requesting suggestions." }, { status: 409 });
  }

  const actions = actionsFor(body.meal_prepared, scan.components as unknown[]);
  const { data: updated, error: updateError } = await supabase.from("scans").update({
    meal_prepared: body.meal_prepared,
    buffer_actions: actions,
  }).eq("id", body.scan_id).eq("user_id", user.id).select("id").maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: "We could not save these meal suggestions." }, { status: 500 });

  return NextResponse.json({ scan_id: body.scan_id, meal_prepared: body.meal_prepared, actions });
}
