import Link from "next/link";
import { redirect } from "next/navigation";
import { AppIcon } from "../components/AppIcon";
import { createClient } from "../lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/home");
  return <main className="min-h-screen bg-background px-5 py-5 text-ink sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-line pb-4"><Link href="/" className="text-lg font-bold tracking-tight">Apetit<span className="text-primary">Scan</span></Link><Link href="/login" className="inline-flex min-h-11 items-center rounded-[14px] px-3 text-sm font-semibold text-secondary hover:bg-white">Log in</Link></header>
      <section className="mx-auto max-w-3xl py-16 sm:py-24"><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">ApetitScan · Nigerian meals</p><h1 className="mt-4 max-w-2xl text-[38px] font-semibold leading-[1.06] tracking-tight sm:text-6xl">A clearer view of the meal in front of you.</h1><p className="mt-5 max-w-xl text-base leading-7 text-secondary">Review foods, portions, and preparation from a photo. Get a carbohydrate range based on verified food data, with uncertainty kept in view.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/login?next=%2Fhome" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">Scan a meal<AppIcon name="arrow" size={18}/></Link><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-[14px] border border-line bg-white px-5 text-sm font-semibold text-ink hover:bg-blue-light">Create an account</Link></div></section>
  </main>;
}
