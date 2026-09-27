import { NextResponse } from "next/server";
import { questionFor } from "../../../lib/services/questions";
export async function POST(request: Request) { try { const body = await request.json() as { flags: { ingredient: string; tier: "always" | "commonly" | "sometimes" }[] }; return NextResponse.json({ questions: body.flags.map((flag) => ({ ingredient: flag.ingredient, question: questionFor(flag.ingredient, flag.tier) })) }); } catch { return NextResponse.json({ error: "We could not create the questions." }, { status: 400 }); } }
