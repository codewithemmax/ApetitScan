import { getNutritionNotes } from "../lib/services/nutrition";
import type { DishIngredient } from "../lib/types";

export function NutritionNotes({ ingredients }: { ingredients: DishIngredient[] }) {
  const notes = getNutritionNotes(ingredients);

  return <section className="overflow-hidden rounded-[1.75rem] bg-navy text-white">
    <div className="grid md:grid-cols-[.8fr_1.2fr]">
      <div className="p-6 md:p-7"><p className="eyebrow text-sky">Nutrition, in context</p><h3 className="display-face mt-3 text-3xl">A few useful cues.</h3><p className="mt-3 text-sm leading-6 text-white/65">Qualitative clues from the possible ingredients, not a nutrient calculation.</p></div>
      <div className="bg-white/5 p-6 md:p-7">
        {notes.cues.length ? <ul className="grid gap-3 sm:grid-cols-2">{notes.cues.map((cue) => <li key={cue.label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-sky">{cue.label}</p><p className="mt-2 text-xs leading-5 text-white/65">{cue.detail}</p></li>)}</ul> : <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">The ingredients here do not give us enough to describe likely macro sources.</p>}
        <div className="mt-4 grid gap-2">{notes.tips.map((tip) => <p key={tip} className="flex gap-3 text-xs leading-5 text-white/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden="true" />{tip}</p>)}</div>
      </div>
    </div>
    <p className="border-t border-white/10 px-6 py-3 text-[11px] leading-5 text-white/45 md:px-7">No calorie or gram-based macro estimate: a photo cannot show portion weight or recipe quantities. General food information only, not personal or medical advice. <a className="underline decoration-white/30 underline-offset-2 hover:text-white" href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet" target="_blank" rel="noreferrer">WHO healthy-diet guidance</a>.</p>
  </section>;
}
