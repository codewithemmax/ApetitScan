import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import { createClient } from "../../lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = (user.user_metadata.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "there";
  const [{ count: scanCount }, { data: allergies }] = await Promise.all([
    supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("allergy_profiles").select("allergen").eq("user_id", user.id),
  ]);

  return <main className="page-shell"><div className="mx-auto max-w-[1320px]"><AppHeader />
    <section className="rise-in relative mt-8 overflow-hidden rounded-[2rem] bg-plum px-6 py-9 text-paper md:mt-12 md:px-12 md:py-14">
      <div className="absolute -right-20 -top-36 h-[470px] w-[470px] rounded-full border border-white/10"/><div className="absolute -right-4 -top-20 h-[340px] w-[340px] rounded-full border border-white/10"/><div className="absolute right-16 top-0 h-[220px] w-[220px] rounded-full border border-lime/25"/>
      <div className="relative max-w-3xl"><p className="eyebrow flex items-center gap-3 text-sky"><span className="h-px w-8 bg-sky"/>Your table, with context</p><h1 className="display-face mt-5 text-5xl leading-[.95] md:text-7xl">Good afternoon,<br/><em className="text-sky">{name}.</em></h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/65 md:text-base">A dish can have many versions. Start with a photo and leave with a better question for the cook.</p><Link href="/scan" className="mt-8 inline-flex items-center gap-6 rounded-full bg-coral px-6 py-4 text-sm font-bold text-white transition hover:bg-blue">Start a dish scan <span className="text-lg">↗</span></Link></div>
      <div className="relative mt-10 flex flex-wrap gap-2 md:absolute md:bottom-8 md:right-10 md:mt-0 md:flex-col"><span className="eyebrow rounded-full border border-white/20 px-4 py-2 text-white/60">Your notebook</span><span className="display-face text-5xl md:text-7xl">{String(scanCount ?? 0).padStart(2,"0")}</span><span className="text-xs font-bold uppercase tracking-[.18em] text-white/55">saved scans</span></div>
    </section>
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Link href="/profile" className="group rounded-[1.7rem] border border-ink/10 bg-white/75 p-6 transition hover:-translate-y-1 hover:bg-white md:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow text-coral">Personal settings / 01</p><h2 className="display-face mt-3 text-4xl">Your allergy notes</h2><p className="mt-2 max-w-sm text-sm leading-6 text-ink/55">These shape which ingredients are highlighted on your next scan.</p></div><span className="display-face text-3xl text-moss transition-transform group-hover:translate-x-1">↗</span></div><div className="mt-7 flex flex-wrap gap-2">{allergies?.length ? allergies.map((row) => <span key={row.allergen} className="rounded-full bg-[#eee8db] px-4 py-2 text-xs font-bold capitalize">{row.allergen}</span>) : <span className="rounded-full border border-dashed border-ink/20 px-4 py-2 text-xs font-semibold text-ink/50">Add allergens to personalize scans</span>}</div></Link>
      <Link href="/history" className="group flex min-h-48 flex-col justify-between rounded-[1.7rem] bg-ice p-6 transition hover:-translate-y-1 md:p-8"><div className="flex items-start justify-between"><p className="eyebrow text-ink/55">A useful question can travel</p><span className="display-face text-3xl text-blue transition-transform group-hover:translate-x-1">↗</span></div><div><h2 className="display-face text-4xl">Visit your history</h2><p className="mt-2 text-sm text-ink/60">Every scan, in one place.</p></div></Link>
    </div>
    <p className="eyebrow mt-10 text-ink/35">PetitScan · Field notes for the Nigerian table</p>
  </div></main>;
}
