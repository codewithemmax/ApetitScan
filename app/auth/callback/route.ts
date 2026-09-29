import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/home";
  const redirectUrl = new URL(next, url.origin);

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "The confirmation link is missing its code.");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "That confirmation link could not be used. Please try again.");
    return NextResponse.redirect(redirectUrl);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: (user.user_metadata.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "ApetitScan user",
    });
  }

  return NextResponse.redirect(redirectUrl);
}
