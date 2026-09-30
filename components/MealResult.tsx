import { formatRange } from "../lib/services/sugarSpoon";
import { DISCLAIMER_TEXT } from "../lib/services/nutritionConfig";
import { AppIcon } from "./AppIcon";

export interface DisplayRange { low: number; high: number; }

export interface ResultComponent {
  component_id?: string;
  food: string;
  category?: string | null;
  food_verified?: boolean;
  portion?: string;
  preparation?: string | null;
  confidence?: { food?: number; portion?: number; preparation?: number };
  food_confirmed?: boolean;
  portion_confirmed?: boolean;
  preparation_confirmed?: boolean;
  carbs_g?: DisplayRange | null;
  entry?: { verified?: boolean; source_note?: string } | null;
}

export interface MealResultData {
  components: ResultComponent[];
  total_carbs_g: DisplayRange | null;
  sugar_spoons: DisplayRange | null;
  meal_impact: string | null;
  confidence?: { vision?: number; portion?: number; nutrition?: number; overall?: number } | null;
  drivers?: string[];
  assumptions?: string[];
  questions?: { component_id?: string; step?: string; prompt?: string; options?: string[] }[];
  disclaimer?: string;
}

function stepLabel(score: number): "High" | "Medium" | "Low" {
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function minimumScore(components: ResultComponent[], step: "food" | "portion" | "preparation"): number {
  const scores = components.map((component) => component.confidence?.[step]).filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  return scores.length > 0 ? Math.min(...scores) : 0;
}

export function EstimateDisclaimer({ text = DISCLAIMER_TEXT }: { text?: string }) {
  return <p className="border-t border-line pt-4 text-[13px] leading-[19px] text-secondary">{text}</p>;
}

export function ConfidenceBreakdown({ components }: { components: ResultComponent[] }) {
  const items = [
    { key: "food", label: "Food", reason: "Some foods were hard to tell apart in the photo." },
    { key: "portion", label: "Portion", reason: "Portion size is estimated from a single photo." },
    { key: "preparation", label: "Preparation", reason: "The photo does not clearly show how this was cooked." },
  ] as const;
  return <section aria-labelledby="confidence-title" className="border-t border-line pt-4">
    <div className="flex items-center gap-2"><AppIcon name="info" size={17} className="text-secondary"/><h3 id="confidence-title" className="text-sm font-semibold">Confidence</h3></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">{items.map((item) => {
      const score = minimumScore(components, item.key);
      const label = stepLabel(score);
      const confirmed = components.length > 0 && components.every((component) => {
        const confirmationKey = item.key === "food" ? "food_confirmed" : item.key === "portion" ? "portion_confirmed" : "preparation_confirmed";
        return component[confirmationKey] === true;
      });
      return <div key={item.key} className="min-w-0 rounded-[14px] bg-background p-3">
        <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{item.label}</span><span className={`text-xs font-semibold ${label === "Low" ? "text-secondary" : "text-primary"}`}>{confirmed ? "Confirmed" : label}</span></div>
        {!confirmed && label !== "High" && <p className="mt-1.5 text-xs leading-5 text-secondary">{item.reason}</p>}
      </div>;
    })}</div>
  </section>;
}

export function SugarSpoonMeter({ range }: { range: DisplayRange }) {
  const count = 12;
  const filledTo = Math.min(count, Math.max(1, Math.ceil(range.high)));
  const filledFrom = Math.min(count, Math.max(0, Math.floor(range.low)));
  return <div aria-label={`Carb spoons range ${formatRange(range, "spoons")}`} className="mt-3">
    <div className="flex h-9 items-end gap-1" aria-hidden="true">{Array.from({ length: count }, (_, index) => <span key={index} className={`flex-1 rounded-t-[3px] transition-colors ${index < filledFrom ? "h-8 bg-primary" : index < filledTo ? "h-5 bg-blue-light ring-1 ring-inset ring-primary/40" : "h-2 bg-line"}`} />)}</div>
    <div className="mt-2 flex items-baseline justify-between gap-3"><p className="text-sm font-semibold">{formatRange(range, "spoons")} carb spoons</p><span className="text-xs text-secondary">Visual estimate</span></div>
    <p className="mt-1 text-xs leading-5 text-secondary">One carb spoon represents 4 g of estimated carbohydrate. The bars are a visual guide, not literal spoons.</p>
  </div>;
}

export function MealImpactCard({ result, onEdit }: { result: MealResultData; onEdit?: () => void }) {
  const hasRange = result.total_carbs_g !== null && result.sugar_spoons !== null;
  return <section aria-labelledby="meal-impact-title" className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.12em] text-secondary">Meal Impact</p><h2 id="meal-impact-title" className="mt-1 text-2xl font-semibold tracking-tight">{result.meal_impact ? result.meal_impact[0].toUpperCase() + result.meal_impact.slice(1) : "Estimate needs a check"}</h2></div>
      {onEdit && <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-line px-3 text-sm font-semibold text-ink hover:bg-background"><AppIcon name="edit" size={17}/>Edit details</button>}
    </div>

    {hasRange ? <div className="mt-5 border-y border-line py-4">
      <p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Estimated carbohydrate</p>
      <p className="mt-1 text-[28px] font-semibold leading-9 tracking-tight">{formatRange(result.total_carbs_g!, "g")}</p>
      <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Carb spoons</p><SugarSpoonMeter range={result.sugar_spoons!}/></div>
    </div> : <p className="mt-4 border-y border-line py-4 text-sm leading-6 text-secondary">We need a verified food, portion, or preparation choice before showing a carbohydrate range.</p>}

    {result.drivers && result.drivers.length > 0 && <div className="py-4"><h3 className="text-sm font-semibold">What shaped this result</h3><ul className="mt-2 space-y-1.5">{result.drivers.map((driver) => <li key={driver} className="text-sm leading-5 text-secondary">{driver}</li>)}</ul></div>}
    {result.assumptions && result.assumptions.length > 0 && <div className="border-t border-line py-4"><h3 className="text-sm font-semibold">Assumptions to review</h3><ul className="mt-2 space-y-1.5">{result.assumptions.map((assumption) => <li key={assumption} className="text-sm leading-5 text-secondary">{assumption}</li>)}</ul></div>}
    {result.questions && result.questions.length > 0 && <div className="border-t border-line py-4"><h3 className="text-sm font-semibold">One more detail</h3><ul className="mt-2 space-y-2">{result.questions.map((item, index) => <li key={`${item.component_id ?? "question"}-${index}`} className="text-sm leading-5 text-secondary">{item.prompt}</li>)}</ul></div>}
    <ConfidenceBreakdown components={result.components}/>
    <div className="mt-4"><EstimateDisclaimer text={result.disclaimer || DISCLAIMER_TEXT}/></div>
  </section>;
}

export function BufferActions({ actions }: { actions: { rank: number; group: string; title: string; description: string }[] }) {
  const groups = ["Prepare", "Adjust", "Recover"];
  const sectionTitle: Record<string, string> = { Prepare: "Before you cook", Adjust: "Before you eat", Recover: "After you eat" };
  return <section aria-labelledby="buffer-title" className="mt-5">
    <div className="mb-3 flex items-center gap-2"><AppIcon name="activity" size={19} className="text-primary"/><h2 id="buffer-title" className="text-lg font-semibold">A few options for this meal</h2></div>
    <div className="space-y-4">{groups.map((group) => {
      const matching = actions.filter((action) => action.group === group).sort((a, b) => a.rank - b.rank);
      if (matching.length === 0) return null;
      return <section key={group} className="rounded-[18px] border border-line bg-white px-4 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">{sectionTitle[group]}</h3>
        <ol className="mt-2 divide-y divide-line">{matching.map((action) => <li key={`${action.rank}-${action.title}`} className="flex gap-3 py-3 first:pt-1 last:pb-0"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-light text-xs font-semibold text-primary">{action.rank}</span><div><p className="text-sm font-semibold">{action.title}</p><p className="mt-1 text-sm leading-5 text-secondary">{action.description}</p></div></li>)}</ol>
      </section>;
    })}</div>
    <p className="mt-3 text-[13px] leading-5 text-secondary">General suggestions, not medical advice.</p>
  </section>;
}
