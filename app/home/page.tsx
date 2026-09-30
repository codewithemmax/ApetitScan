"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppIcon } from "../../components/AppIcon";
import type { DisplayRange } from "../../components/MealResult";
import { formatRange } from "../../lib/services/sugarSpoon";
import { DISCLAIMER_TEXT } from "../../lib/services/nutritionConfig";

interface RecentScan { id: string; status: string; meal_name: string | null; meal_impact: string | null; total_carbs_g: DisplayRange | null; sugar_spoons: DisplayRange | null; created_at: string; }

export default function HomePage() {
  const [latest, setLatest] = useState<RecentScan | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void fetch("/api/history").then((response) => {
      if (response.status === 401) { window.location.assign("/login?next=%2Fhome"); return Promise.reject(); }
      return response.ok ? response.json() as Promise<{ scans: RecentScan[] }> : Promise.reject();
    })
      .then((payload) => setLatest(payload.scans[0] ?? null)).catch(() => setLatest(null)).finally(() => setLoaded(true));
  }, []);
  return <main className="page-shell mx-auto max-w-5xl">
    <AppHeader/>
    <section className="mx-auto max-w-3xl pb-8 pt-8 sm:pt-12">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-secondary">ApetitScan · Your meal notes</p>
      <h1 className="mt-3 max-w-2xl text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-5xl">Understand the meal in front of you.</h1>
      <p className="mt-3 max-w-xl text-base leading-6 text-secondary">See what was identified, review the assumptions, and get a carbohydrate range based on verified food data.</p>
      <Link href="/scan" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"><AppIcon name="camera" size={19}/>Scan a meal<AppIcon name="arrow" size={18}/></Link>
    </section>

    <section className="mx-auto max-w-3xl border-t border-line pt-6" aria-labelledby="recent-title">
      <div className="flex items-center justify-between gap-4"><div><h2 id="recent-title" className="text-lg font-semibold">Recent activity</h2><p className="mt-1 text-sm text-secondary">Your saved meal scans, in one place.</p></div><Link href="/history" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">History<AppIcon name="chevron" size={16}/></Link></div>
      {!loaded ? <p className="mt-4 text-sm text-secondary">Loading recent scans…</p> : latest ? <Link href="/history" className="mt-4 block rounded-[18px] border border-line bg-white p-4 transition-colors hover:border-primary/40 sm:p-5">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-base font-semibold">{latest.meal_name || "Saved meal scan"}</p><p className="mt-1 text-sm text-secondary">{new Date(latest.created_at).toLocaleString()}</p></div><span className="shrink-0 rounded-full bg-blue-light px-3 py-1.5 text-xs font-semibold capitalize text-primary">{latest.meal_impact ?? "Needs a check"}</span></div>
        {latest.total_carbs_g && <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3"><p className="text-sm"><span className="text-secondary">Estimated carbohydrate </span><span className="font-semibold">{formatRange(latest.total_carbs_g, "g")}</span></p>{latest.sugar_spoons && <p className="text-sm"><span className="text-secondary">Carb spoons </span><span className="font-semibold">{formatRange(latest.sugar_spoons, "spoons")}</span></p>}</div>}
        {(latest.total_carbs_g || latest.sugar_spoons || latest.meal_impact) && <p className="mt-3 border-t border-line pt-3 text-[13px] leading-[19px] text-secondary">{DISCLAIMER_TEXT}</p>}
      </Link> : <div className="mt-4 rounded-[18px] border border-line bg-white px-5 py-6"><p className="text-base font-semibold">Your scans will appear here.</p><p className="mt-1 text-sm leading-5 text-secondary">Start with a meal photo. You can review the food, portion, and preparation details before seeing an estimate.</p><Link href="/scan" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Scan your first meal<AppIcon name="arrow" size={17}/></Link></div>}
    </section>
  </main>;
}
