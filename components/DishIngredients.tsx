import type { DishIngredient } from "../lib/types";

const tiers = ["always", "commonly", "sometimes"] as const;
const labels = { always: "Always contains", commonly: "Commonly contains", sometimes: "Sometimes contains" } as const;

export function DishIngredients({ ingredients }: { ingredients: DishIngredient[] }) {
  return <section className="rounded-[1.75rem] border border-ink/10 bg-white/75 p-5 md:p-7">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow text-blue">Dish notes</p><h3 className="display-face mt-2 text-3xl">Possible ingredients</h3></div><span className="text-xs text-ink/45">Recipe patterns, not a label</span></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">{tiers.map((tier) => {
      const items = ingredients.filter((item) => item.tier === tier);
      return <div key={tier} className="rounded-2xl bg-ice p-4">
        <p className="eyebrow text-navy">{labels[tier]}</p>
        {items.length ? <ul className="mt-3 space-y-2">{items.map((item) => <li key={`${item.ingredient}-${item.allergenCategory}`} className="text-sm leading-5 text-ink/80"><span className="mr-2 text-blue" aria-hidden="true">·</span>{item.ingredient}{item.regionalNote && <span className="mt-1 block pl-4 text-xs leading-5 text-ink/55">{item.regionalNote}</span>}</li>)}</ul> : <p className="mt-3 text-xs leading-5 text-ink/45">No ingredients listed at this tier.</p>}
      </div>;
    })}</div>
    <p className="mt-4 text-xs leading-5 text-ink/50">Household recipes vary. Confirm ingredients and preparation directly with the cook.</p>
  </section>;
}
