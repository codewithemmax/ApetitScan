import { NextResponse } from "next/server";
import { matchIngredients } from "../../../lib/services/match";
export async function POST(request: Request) { try { const body = await request.json() as { ingredients: Parameters<typeof matchIngredients>[0]; allergens: string[] }; return NextResponse.json({ flags: matchIngredients(body.ingredients, body.allergens) }); } catch { return NextResponse.json({ error: "We could not check those ingredients." }, { status: 400 }); } }
