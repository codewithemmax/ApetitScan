import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "The ApetitScan scan flow is being rebuilt." }, { status: 501 });
}