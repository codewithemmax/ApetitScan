"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";
import { AppHeader } from "./AppHeader";
import { BufferActions, MealImpactCard, type MealResultData, type ResultComponent } from "./MealResult";

type MealState = "before_cooking" | "prepared" | "eaten";
type Portion = "small" | "medium" | "large" | "";
interface Draft { food: string; portion: Portion; preparation: string; }
interface ScanComponent extends ResultComponent {
  component_id: string;
  food: string;
  portion: string;
  preparation: string;
  confidence: { food: number; portion: number; preparation: number };
  requires_confirmation: { food: boolean; portion: boolean; preparation: boolean };
}
interface ScanQuestion { component_id: string; step: string; prompt: string; options: string[]; }
type EstimateQuestion = ScanQuestion;
interface ScanPayload {
  scan_id: string;
  components: ScanComponent[];
  questions: ScanQuestion[];
  food_options: string[];
  main_carbohydrate_options: string[];
  preparation_options: Record<string, string[]>;
}
interface ApiError { error?: string; }
interface BufferAction { rank: number; group: string; title: string; description: string; }

const portionOptions: Exclude<Portion, "">[] = ["small", "medium", "large"];
const unknownFoods = new Set(["unknown", "unidentified", "unknown food", "unidentified food"]);

function isUnknownFood(food: string) { return unknownFoods.has(food.trim().toLocaleLowerCase("en")); }

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & ApiError;
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!response.ok) throw new Error(data.error || "We couldn't complete this step. Please try again.");
  return data;
}

function QuestionHint({ question }: { question?: ScanQuestion }) {
  if (!question) return null;
  return <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-secondary"><AppIcon name="info" size={16} className="mt-0.5 shrink-0 text-primary"/>{question.prompt}</p>;
}

export function PortionPicker({ value, onChange, question }: { value: Portion; onChange: (value: Portion) => void; question?: ScanQuestion }) {
  return <fieldset className="mt-4">
    <legend className="text-sm font-semibold">Portion</legend><QuestionHint question={question}/>
    <div className="mt-2 grid grid-cols-3 gap-2">{portionOptions.map((portion) => <button key={portion} type="button" aria-pressed={value === portion} onClick={() => onChange(portion)} className={`min-h-11 rounded-[14px] border px-3 text-sm font-semibold capitalize transition-colors ${value === portion ? "border-primary bg-blue-light text-primary" : "border-line bg-white text-secondary hover:border-primary/40"}`}>{portion}</button>)}</div>
  </fieldset>;
}

export function PreparationPicker({ value, options, onChange, question }: { value: string; options: string[]; onChange: (value: string) => void; question?: ScanQuestion }) {
  return <label className="mt-4 block"><span className="text-sm font-semibold">Preparation</span><QuestionHint question={question}/>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-[14px] border border-line bg-white px-3 text-sm text-ink focus:border-primary">
      <option value="">Choose a preparation</option>{options.map((preparation) => <option key={preparation} value={preparation}>{preparation}</option>)}
    </select>
    {options.length === 0 && <span className="mt-1 block text-xs leading-5 text-secondary">No verified preparation options are available for this food yet.</span>}
  </label>;
}

export function MealPreparedPrompt({ value, onChange }: { value: MealState | ""; onChange: (value: MealState) => void }) {
  const options: { value: MealState; title: string; detail: string }[] = [
    { value: "before_cooking", title: "Before cooking", detail: "The meal has not been prepared yet." },
    { value: "prepared", title: "Prepared, not eaten", detail: "The meal is ready, but you have not started eating." },
    { value: "eaten", title: "Already eating or eaten", detail: "Only after-meal options will be shown." },
  ];
  return <fieldset className="mt-5 border-t border-line pt-5">
    <legend className="text-base font-semibold">Where are you with this meal?</legend><p className="mt-1 text-sm leading-5 text-secondary">This helps keep the next-step suggestions practical.</p>
    <div className="mt-3 grid gap-2">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`flex min-h-14 items-start gap-3 rounded-[14px] border p-3 text-left transition-colors ${value === option.value ? "border-primary bg-blue-light" : "border-line bg-white hover:border-primary/40"}`}>
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${value === option.value ? "border-primary bg-primary text-white" : "border-secondary/40 text-transparent"}`}>{value === option.value && <AppIcon name="check" size={13}/>}</span>
      <span><span className="block text-sm font-semibold">{option.title}</span><span className="mt-0.5 block text-xs leading-5 text-secondary">{option.detail}</span></span>
    </button>)}</div>
  </fieldset>;
}

export function PhotoCapture({
  image, previewUrl, onChoose, onClear, disabled,
}: { image: File | null; previewUrl: string | null; onChoose: (file: File | null) => void; onClear: () => void; disabled: boolean }) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  function accept(file?: File) {
    if (!file) return;
    onChoose(file);
  }
  return <section aria-labelledby="photo-title" className="rounded-[18px] border border-line bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">ApetitScan · New scan</p><h1 id="photo-title" className="mt-1 text-xl font-semibold tracking-tight">A look at your meal</h1></div><AppIcon name="camera" size={23} className="text-primary"/></div>
    <div className="mt-4 overflow-hidden rounded-[14px] border border-line bg-background">
      {previewUrl ? <div className="relative"><img src={previewUrl} alt="Selected meal preview" className="max-h-[420px] min-h-52 w-full object-cover"/><button type="button" disabled={disabled} onClick={onClear} className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-3 text-sm font-semibold shadow-sm"><AppIcon name="close" size={16}/>Remove photo</button></div> : <div className="flex min-h-56 flex-col items-center justify-center px-5 py-8 text-center sm:min-h-72"><span className="grid h-14 w-14 place-items-center rounded-[18px] bg-blue-light text-primary"><AppIcon name="camera" size={27}/></span><p className="mt-4 text-base font-semibold">Keep the whole plate in view</p><p className="mt-1 max-w-sm text-sm leading-5 text-secondary">A clear photo helps identify each part. You can review every assumption before estimating.</p></div>}
    </div>
    <input ref={cameraInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => accept(event.target.files?.[0])}/>
    <input ref={uploadInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => accept(event.target.files?.[0])}/>
    <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
      <button type="button" disabled={disabled} onClick={() => cameraInput.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"><AppIcon name="camera" size={18}/>{image ? "Take another photo" : "Take a meal photo"}</button>
      <button type="button" disabled={disabled} aria-label="Upload an existing meal photo" onClick={() => uploadInput.current?.click()} className="grid min-h-12 min-w-12 place-items-center rounded-[14px] border border-line bg-white text-ink hover:bg-background disabled:opacity-60"><AppIcon name="image" size={20}/></button>
    </div>
  </section>;
}

export function ClarifyPrompt({
  scan, drafts, onDraftChange, mealState, onMealStateChange,
}: { scan: ScanPayload; drafts: Record<string, Draft>; onDraftChange: (id: string, draft: Draft) => void; mealState: MealState | ""; onMealStateChange: (value: MealState) => void }) {
  return <section className="mt-5" aria-labelledby="clarify-title">
    <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Check the details</p><h2 id="clarify-title" className="mt-1 text-xl font-semibold">Does this look right?</h2><p className="mt-1 text-sm leading-5 text-secondary">These are photo-based assumptions. Review and change each one before continuing.</p></div>
    <div className="space-y-3">{scan.components.map((component, index) => {
      const draft = drafts[component.component_id];
      const currentQuestion = (step: string) => scan.questions.find((question) => question.component_id === component.component_id && (question.step === step || (step === "food" && question.step === "main_carbohydrate")));
      const preparationOptions = scan.preparation_options[draft.food] ?? [];
      const foodOptions = currentQuestion("food")?.options?.length ? currentQuestion("food")!.options : scan.food_options;
      return <article key={component.component_id} className="rounded-[18px] border border-line bg-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Food {index + 1}</p><p className="mt-1 text-base font-semibold">{draft.food || "Choose a food"}</p></div><span className="rounded-full bg-blue-light px-2.5 py-1 text-xs font-semibold text-primary">{component.food_verified ? "Verified data" : "Choose food"}</span></div>
        {currentQuestion("food") && <QuestionHint question={currentQuestion("food")}/>}
        <label className="mt-3 block"><span className="text-sm font-semibold">Food</span><select value={draft.food} onChange={(event) => {
          const food = event.target.value;
          const nextPreparations = scan.preparation_options[food] ?? [];
          onDraftChange(component.component_id, { ...draft, food, preparation: nextPreparations.includes(draft.preparation) ? draft.preparation : "" });
        }} className="mt-2 min-h-11 w-full rounded-[14px] border border-line bg-white px-3 text-sm text-ink focus:border-primary"><option value="">Choose a verified food</option>{foodOptions.map((food) => <option key={food} value={food}>{food}</option>)}</select></label>
        <PortionPicker value={draft.portion} onChange={(portion) => onDraftChange(component.component_id, { ...draft, portion })} question={currentQuestion("portion")}/>
        <PreparationPicker value={draft.preparation} options={preparationOptions} onChange={(preparation) => onDraftChange(component.component_id, { ...draft, preparation })} question={currentQuestion("preparation")}/>
        <p className="mt-3 text-xs text-secondary">Photo guess: {component.food}{component.portion ? ` · ${component.portion} portion` : ""}{component.preparation ? ` · ${component.preparation}` : ""}</p>
      </article>;
    })}</div>
    <MealPreparedPrompt value={mealState} onChange={onMealStateChange}/>
  </section>;
}

export function ScanFlow() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanPayload | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [mealState, setMealState] = useState<MealState | "">("");
  const [result, setResult] = useState<MealResultData | null>(null);
  const [actions, setActions] = useState<BufferAction[]>([]);
  const [phase, setPhase] = useState<"idle" | "identifying" | "clarify" | "estimating" | "result">("idle");
  const [error, setError] = useState("");
  const [bufferError, setBufferError] = useState("");
  const [question, setQuestion] = useState("");
  const busy = phase === "identifying" || phase === "estimating";

  useEffect(() => {
    if (!image) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const photoName = useMemo(() => image?.name ?? "", [image]);

  function resetScan() {
    setScan(null); setDrafts({}); setResult(null); setActions([]); setError(""); setBufferError(""); setQuestion(""); setMealState(""); setPhase("idle"); setImage(null);
  }

  async function identify() {
    if (!image) { setError("Take or upload a meal photo first."); return; }
    if (!image.type.startsWith("image/")) { setError("Choose a JPEG, PNG, or WebP image."); return; }
    if (image.size > 8 * 1024 * 1024) { setError("Choose an image that is 8 MB or smaller."); return; }
    setError(""); setPhase("identifying"); setResult(null); setActions([]);
    const form = new FormData(); form.append("image", image);
    try {
      const payload = await readJson<ScanPayload>(await fetch("/api/scan", { method: "POST", body: form }));
      setScan(payload);
      const mainOptions = payload.main_carbohydrate_options ?? [];
      const nextDrafts: Record<string, Draft> = {};
      for (const component of payload.components) {
        const food = isUnknownFood(component.food) ? "" : component.food;
        const prepOptions = payload.preparation_options?.[food] ?? [];
        nextDrafts[component.component_id] = {
          food,
          portion: portionOptions.includes(component.portion as Exclude<Portion, "">) ? component.portion as Exclude<Portion, ""> : "",
          preparation: prepOptions.find((item) => item.toLocaleLowerCase("en") === component.preparation.toLocaleLowerCase("en")) ?? "",
        };
        if (!food && mainOptions.length === 0) nextDrafts[component.component_id].food = "";
      }
      setDrafts(nextDrafts); setPhase("clarify");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't identify the meal photo. Please try again.");
      setPhase("idle");
    }
  }

  async function updateEstimate() {
    if (!scan) return;
    const incomplete = scan.components.find((component) => {
      const draft = drafts[component.component_id];
      return !draft?.food || !draft.portion || !draft.preparation;
    });
    if (incomplete) { setError("Choose a verified food, portion, and preparation for every component."); setQuestion(incomplete.component_id); return; }
    if (!mealState) { setError("Choose where you are with this meal so the suggestions fit."); return; }
    setError(""); setBufferError(""); setPhase("estimating");

    try {
      let workingComponents = [...scan.components];
      for (const identified of scan.components) {
        const draft = drafts[identified.component_id];
        const findCurrent = () => workingComponents.find((component) => component.component_id === identified.component_id) ?? identified;
        const correct = async (step: "food" | "main_carbohydrate" | "portion" | "preparation", corrected: string) => {
          const response = await fetch("/api/correct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scan_id: scan.scan_id, component_id: identified.component_id, step, corrected }) });
          const payload = await readJson<{ components?: ScanComponent[] }>(response);
          if (payload.components) workingComponents = payload.components;
        };
        let current = findCurrent();
        if (draft.food !== current.food) {
          const step = isUnknownFood(current.food) || !scan.food_options.includes(current.food) ? "main_carbohydrate" : "food";
          await correct(step, draft.food); current = findCurrent();
        }
        if (draft.portion !== current.portion) { await correct("portion", draft.portion); current = findCurrent(); }
        if (draft.preparation !== current.preparation) await correct("preparation", draft.preparation);
      }
      const confirmed = scan.components.map((component) => {
        const draft = drafts[component.component_id];
        return { component_id: component.component_id, food: draft.food, food_confirmed: true, portion: draft.portion, portion_confirmed: true, preparation: draft.preparation, preparation_confirmed: true };
      });
      const estimatePayload = await readJson<Partial<MealResultData> & { scan_id: string; status: string; components?: ScanComponent[]; questions?: EstimateQuestion[] }>(await fetch("/api/estimate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scan_id: scan.scan_id, components: confirmed }) }));
      const estimate: MealResultData = {
        components: estimatePayload.components ?? scan.components,
        total_carbs_g: estimatePayload.total_carbs_g ?? null,
        sugar_spoons: estimatePayload.sugar_spoons ?? null,
        meal_impact: estimatePayload.meal_impact ?? null,
        confidence: estimatePayload.confidence ?? null,
        drivers: estimatePayload.drivers,
        assumptions: estimatePayload.assumptions,
        questions: estimatePayload.questions,
        disclaimer: estimatePayload.disclaimer,
      };
      setResult(estimate); setScan({ ...scan, components: estimate.components as ScanComponent[], questions: estimatePayload.questions ?? scan.questions });
      if (!estimate.total_carbs_g || !estimate.sugar_spoons) { setActions([]); setPhase("result"); return; }
      const buffer = await readJson<{ actions: BufferAction[] }>(await fetch("/api/buffer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scan_id: scan.scan_id, meal_prepared: mealState !== "before_cooking", meal_eaten: mealState === "eaten" }) }));
      setActions(buffer.actions); setPhase("result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't estimate this meal. Please review the details and try again.");
      setPhase("clarify");
    }
  }

  async function refreshBuffer() {
    if (!scan || !mealState) return;
    setBufferError("");
    try {
      const response = await fetch("/api/buffer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scan_id: scan.scan_id, meal_prepared: mealState !== "before_cooking", meal_eaten: mealState === "eaten" }) });
      const payload = await readJson<{ actions: BufferAction[] }>(response); setActions(payload.actions);
    } catch (caught) { setBufferError(caught instanceof Error ? caught.message : "We couldn't reload the suggestions."); }
  }

  return <main className="page-shell mx-auto max-w-3xl">
    <AppHeader/>
    <div className="mx-auto max-w-xl pb-5 pt-6">
      <div aria-live="polite" className="mb-4 min-h-6 text-sm font-medium text-primary">{phase === "identifying" ? "Identifying foods..." : phase === "estimating" ? "Estimating carbohydrates..." : ""}</div>
      {!scan ? <>
        <PhotoCapture image={image} previewUrl={previewUrl} onChoose={(file) => { setError(""); setImage(file); }} onClear={() => setImage(null)} disabled={busy}/>
        {photoName && <p className="mt-2 truncate text-xs text-secondary">Selected photo: {photoName}</p>}
        {error && <p role="alert" className="mt-3 rounded-[14px] border border-line bg-white p-3 text-sm text-ink">{error}</p>}
        <button type="button" onClick={() => void identify()} disabled={!image || busy} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><AppIcon name="scan" size={18}/>Identify this meal</button>
      </> : <>
        {phase === "result" && result ? <>
          <MealImpactCard result={result} onEdit={() => { setPhase("clarify"); setError(""); }}/>
          {result.total_carbs_g && result.sugar_spoons && (actions.length ? <BufferActions actions={actions}/> : <div className="mt-4"><p className="text-sm text-secondary">Suggestions are temporarily unavailable.</p><button onClick={() => void refreshBuffer()} className="mt-2 min-h-11 rounded-[14px] border border-line px-4 text-sm font-semibold">Try again</button></div>)}
          {bufferError && <p role="alert" className="mt-3 text-sm text-secondary">{bufferError}</p>}
          <button type="button" onClick={resetScan} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><AppIcon name="camera" size={18}/>Scan another meal</button>
        </> : <>
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Photo identified</p><h1 className="mt-1 text-xl font-semibold">Review your meal</h1></div><button type="button" onClick={resetScan} disabled={busy} className="min-h-11 rounded-[14px] px-3 text-sm font-semibold text-secondary hover:bg-white">Start over</button></div>
          {scan.questions.length > 0 && <div className="mb-4 flex gap-2 rounded-[14px] border border-line bg-blue-light p-3 text-sm leading-5 text-ink"><AppIcon name="info" size={18} className="mt-0.5 shrink-0 text-primary"/>A few details need your attention. Review the photo assumptions below; every one can be changed.</div>}
          <ClarifyPrompt scan={scan} drafts={drafts} onDraftChange={(id, draft) => { setDrafts((previous) => ({ ...previous, [id]: draft })); setQuestion(""); }} mealState={mealState} onMealStateChange={setMealState}/>
          {question && <p role="alert" className="mt-3 text-sm font-medium text-secondary">Please complete the highlighted meal details.</p>}
          {error && <p role="alert" className="mt-3 rounded-[14px] border border-line bg-white p-3 text-sm text-ink">{error}</p>}
          <button type="button" onClick={() => void updateEstimate()} disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60">{busy ? "Estimating carbohydrates..." : "Use these details and estimate"}<AppIcon name="arrow" size={18}/></button>
        </>}
      </>}
      <p className="mt-5 text-center text-xs leading-5 text-secondary">ApetitScan uses verified food data when available. Unclear details stay visible for you to review.</p>
    </div>
  </main>;
}
