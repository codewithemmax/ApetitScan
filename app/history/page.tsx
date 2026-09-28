"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";
import { DishIngredients } from "../../components/DishIngredients";
import { NutritionNotes } from "../../components/NutritionNotes";
import type { DishIngredient, Flag, Source } from "../../lib/types";

interface HistoryScan {
  id: string;
  matched_dish: string | null;
  flags: Flag[];
  ingredients: DishIngredient[];
  source: Source;
  created_at: string;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("We could not load your scan history.");
      const payload = await response.json() as { scans: HistoryScan[] };
      setScans(payload.scans);
    } catch {
      setError("We could not load your scan history. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function remove(id: string) {
    const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
    if (response.ok) setScans((current) => current.filter((scan) => scan.id !== id));
  }

  return <main className="page-shell min-h-screen px-5 py-6 md:px-8">
    <div className="mx-auto max-w-5xl"><AppHeader />
      <section className="pb-10 pt-14 md:pb-14 md:pt-20">
        <p className="eyebrow text-coral">The notebook</p>
        <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><h1 className="display-face max-w-2xl text-5xl leading-[.98] tracking-tight md:text-7xl">Good questions<br />stay with you.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink/65">A personal record of dishes explored, ingredients to ask about, and moments you wanted to remember.</p></div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-ink/10 bg-white/60 px-5 py-4"><span className="display-face block text-3xl">{scans.length}</span><span className="mt-1 block text-xs uppercase tracking-wider text-ink/55">Saved scans</span></div>
            <Link href="/scan" className="flex items-center rounded-2xl bg-plum px-5 py-4 text-sm font-semibold text-paper transition hover:bg-ink">Scan a dish <span className="ml-3" aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      {loading ? <div className="rounded-3xl bg-white/70 p-8 text-sm text-ink/60">Opening your notebook...</div>
        : error ? <div role="alert" className="rounded-3xl bg-[#fff0e9] p-6 text-sm text-coral">{error}</div>
        : scans.length === 0 ? <section className="rounded-[2rem] border border-ink/10 bg-white/65 px-7 py-12 text-center md:py-16"><span className="mx-auto block h-1.5 w-14 rounded-full bg-citron" /><p className="eyebrow mt-7 text-moss">A page waiting to be filled</p><h2 className="display-face mt-3 text-4xl">Your first scan starts here.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/60">Explore a Nigerian dish and keep the ingredient questions close at hand.</p><Link href="/scan" className="mt-7 inline-flex rounded-full bg-plum px-6 py-3 text-sm font-semibold text-paper">Explore a dish <span className="ml-3" aria-hidden="true">↗</span></Link></section>
        : <section className="grid gap-4 md:grid-cols-2">{scans.map((scan, index) => <article key={scan.id} className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white/75 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-plum/5">
          <button aria-expanded={open === scan.id} onClick={() => setOpen(open === scan.id ? null : scan.id)} className="w-full p-6 text-left md:p-7">
            <div className="flex items-center justify-between"><span className="eyebrow text-moss">Entry {String(scans.length - index).padStart(2, "0")}</span><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] ${scan.source === "cache" ? "bg-citron/70 text-ink" : "bg-[#fff0cf] text-[#725b20]"}`}>{scan.source === "cache" ? "Verified" : "Estimated"}</span></div>
            <h2 className="display-face mt-6 text-3xl leading-tight">{scan.matched_dish ?? "Unidentified Nigerian dish"}</h2>
            <div className="mt-5 flex items-end justify-between border-t border-ink/10 pt-4"><time className="text-xs text-ink/55" dateTime={scan.created_at}>{new Date(scan.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</time><span className="text-sm text-coral">{scan.flags.length} {scan.flags.length === 1 ? "question" : "questions"} <span aria-hidden="true">{open === scan.id ? "−" : "+"}</span></span></div>
          </button>
          {open === scan.id && <div className="space-y-5 border-t border-ink/10 bg-paper/70 p-6 md:p-7">
            {scan.ingredients?.length ? <><DishIngredients ingredients={scan.ingredients} /><NutritionNotes ingredients={scan.ingredients} /></> : <p className="rounded-2xl bg-white/70 p-4 text-sm leading-6 text-ink/60">Ingredient details were not saved for this older scan. Scan the dish again to see its ingredient and nutrition notes.</p>}
            {scan.flags.length ? <div className="space-y-3">{scan.flags.map((flag) => <div key={`${flag.allergen}-${flag.ingredient}`} className="rounded-2xl border border-coral/15 bg-white/80 p-4"><p className="text-xs font-bold uppercase tracking-wider text-coral">{flag.allergen} <span className="font-normal text-ink/50">· {flag.ingredient}</span></p><p className="mt-3 text-sm leading-6 text-ink/75"><span className="font-semibold text-ink">Ask the cook:</span> “{flag.question}”</p>{flag.regionalNote && <p className="mt-2 text-xs leading-5 text-ink/55">{flag.regionalNote}</p>}</div>)}</div> : <p className="rounded-2xl bg-white/70 p-4 text-sm leading-6 text-ink/60">No profile flags were recorded for this scan. Recipes and preparation vary; ask the cook about any ingredients you are unsure about.</p>}
            <button onClick={() => void remove(scan.id)} className="mt-5 text-xs font-semibold uppercase tracking-wider text-coral hover:text-ink">Delete entry</button>
          </div>}
        </article>)}</section>}
      <footer className="py-10 text-center text-xs text-ink/45">A little more confidence, one good question at a time.</footer>
    </div>
  </main>;
}
