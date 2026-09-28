"use client";

import { useMemo } from "react";
import { DishIngredients } from "./DishIngredients";
import { NutritionNotes } from "./NutritionNotes";
import type { Flag, ScanResult } from "../lib/types";

export function ResultCard({ result, preview }: { result: ScanResult; preview: string }) {
  const grouped = useMemo(() => (["always", "commonly", "sometimes"] as const)
    .map((tier) => ({ tier, flags: result.flags.filter((flag) => flag.tier === tier) }))
    .filter((group) => group.flags.length), [result.flags]);
  const verified = result.source === "cache";

  return <section aria-live="polite" className="mt-9 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-xl shadow-plum/5">
    <div className="grid md:grid-cols-[.78fr_1.22fr]">
      <div className="relative min-h-72 overflow-hidden bg-[#e9e2d3] md:min-h-full">
        {preview ? <img src={preview} alt="The meal submitted for identification" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><div className="h-48 w-48 rounded-full border border-plum/15 bg-paper shadow-inner"><div className="m-5 flex h-[calc(100%-2.5rem)] items-center justify-center rounded-full border border-coral/25"><span className="display-face text-2xl text-plum/55">PetitScan</span></div></div></div>}
        <span className="absolute left-5 top-5 rounded-full bg-paper/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-ink">Your scan</span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5 pt-14"><p className="text-xs text-white/75">Visual identification is an estimate</p></div>
      </div>
      <div className="space-y-7 p-6 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] ${verified ? "bg-citron text-ink" : "bg-[#fff0cf] text-[#725b20]"}`}>{verified ? "Verified dish" : "Estimated match"}</span><span className="text-xs text-ink/45">{result.ingredients.length} ingredients considered</span></div>
        <h2 className="display-face mt-5 text-4xl leading-tight md:text-5xl">{result.dishName}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">{verified ? "This dish is listed in our hand-checked reference library. Individual recipes and preparation can still vary." : "This identification is an estimate. Local recipes and kitchen practices vary; use the questions below to check with the cook."}</p>

        <DishIngredients ingredients={result.ingredients} />
        <NutritionNotes ingredients={result.ingredients} />
        <div className="flex items-center gap-3"><span className="h-px flex-1 bg-ink/10" /><span className="eyebrow text-blue">Allergy profile check</span><span className="h-px flex-1 bg-ink/10" /></div>
        {grouped.length ? <div className="space-y-6">{grouped.map(({ tier, flags }) => <section key={tier}>
          <h3 className="eyebrow text-moss">{tier === "always" ? "Often part of the dish" : tier === "commonly" ? "Commonly found in versions" : "Sometimes used"}</h3>
          <div className="mt-3 space-y-3">{flags.map((flag) => <FlagItem key={`${flag.allergen}-${flag.ingredient}`} flag={flag} />)}</div>
        </section>)}</div> : <div className="rounded-2xl border border-moss/15 bg-[#f1f1e7] p-5"><p className="text-sm font-semibold text-ink">No matching allergens were flagged for this profile.</p><p className="mt-2 text-sm leading-6 text-ink/60">This is not a guarantee about the meal. Recipes, substitutions, and preparation can vary. Ask the cook about ingredients you are unsure about.</p></div>}
        <p className="border-t border-ink/10 pt-4 text-xs leading-5 text-ink/45">PetitScan is a food-information aid, not medical advice. If you have a serious allergy, confirm ingredients and preparation directly with the cook.</p>
      </div>
    </div>
  </section>;
}

function FlagItem({ flag }: { flag: Flag }) {
  return <div className="rounded-2xl border border-coral/15 bg-[#fffaf6] p-4 md:p-5">
    <p className="text-sm font-semibold capitalize text-ink">{flag.allergen}<span className="font-normal text-ink/50"> · {flag.ingredient}</span></p>
    {flag.regionalNote && <p className="mt-2 text-xs leading-5 text-ink/55">{flag.regionalNote}</p>}
    <div className="mt-4 rounded-xl bg-white/80 p-3"><p className="eyebrow text-coral">Ask the cook</p><p className="mt-1.5 text-sm leading-6 text-ink/80">“{flag.question}”</p></div>
  </div>;
}
