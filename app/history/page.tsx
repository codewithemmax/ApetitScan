"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";
import { AppIcon } from "../../components/AppIcon";
import { BufferActions, MealImpactCard, type DisplayRange, type MealResultData, type ResultComponent } from "../../components/MealResult";
import { formatRange } from "../../lib/services/sugarSpoon";
import { DISCLAIMER_TEXT } from "../../lib/services/nutritionConfig";

interface HistoryScan { id: string; status: string; meal_name: string | null; created_at: string; meal_impact: string | null; total_carbs_g: DisplayRange | null; sugar_spoons: DisplayRange | null; }
interface SavedScan extends MealResultData { id: string; status: string; meal_prepared: boolean | null; buffer_actions: { rank: number; group: string; title: string; description: string }[] | null; created_at: string; }

function validRange(value: unknown): value is DisplayRange {
  if (typeof value !== "object" || value === null || !("low" in value) || !("high" in value)) return false;
  const range = value as DisplayRange;
  return Number.isFinite(range.low) && Number.isFinite(range.high) && range.low >= 0 && range.high >= range.low;
}

function savedResult(scan: SavedScan, disclaimer: string): MealResultData {
  return {
    components: Array.isArray(scan.components) ? scan.components : [],
    total_carbs_g: validRange(scan.total_carbs_g) ? scan.total_carbs_g : null,
    sugar_spoons: validRange(scan.sugar_spoons) ? scan.sugar_spoons : null,
    meal_impact: scan.meal_impact,
    confidence: scan.confidence,
    disclaimer,
  };
}

function SavedComponentList({ components }: { components: ResultComponent[] }) {
  return <section className="mt-5" aria-labelledby="saved-details-title">
    <h3 id="saved-details-title" className="text-base font-semibold">Saved meal details</h3>
    <ul className="mt-2 divide-y divide-line border-y border-line bg-white">{components.map((component, index) => <li key={component.component_id ?? `${component.food}-${index}`} className="py-3">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-semibold capitalize">{component.food}</p><p className="mt-1 text-sm text-secondary">{component.portion || "Portion not saved"} portion · {component.preparation || "Preparation not saved"}</p><p className="mt-1 text-xs text-secondary">Food {component.food_confirmed ? "confirmed" : "assumed"} · Portion {component.portion_confirmed ? "confirmed" : "assumed"} · Preparation {component.preparation_confirmed ? "confirmed" : "assumed"}</p></div>
        {validRange(component.carbs_g) && <span className="shrink-0 text-sm font-semibold">{formatRange(component.carbs_g, "g")}</span>}</div>
      {component.entry?.source_note && <details className="mt-2 text-xs text-secondary"><summary className="min-h-8 cursor-pointer py-1 font-semibold">Food data source</summary><p className="leading-5">{component.entry.source_note}</p></details>}
    </li>)}</ul>
  </section>;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SavedScan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetch("/api/history").then(async (response) => {
      if (response.status === 401) { window.location.assign("/login?next=%2Fhistory"); throw new Error("Please log in to view saved scans."); }
      if (!response.ok) throw new Error("We could not load your saved scans. Try again shortly.");
      return response.json() as Promise<{ scans: HistoryScan[] }>;
    }).then((payload) => setScans(payload.scans)).catch((caught) => setError(caught instanceof Error ? caught.message : "We could not load your saved scans."))
      .finally(() => setLoading(false));
  }, []);

  async function openScan(id: string) {
    setNotice(""); setDetailLoading(true);
    try {
      const response = await fetch(`/api/history/${id}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not open this saved result.");
      setSelected({ ...payload.scan, disclaimer: payload.disclaimer } as SavedScan);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not open this saved result."); }
    finally { setDetailLoading(false); }
  }

  async function deleteScan(id: string) {
    if (!window.confirm("Delete this saved meal scan?")) return;
    setBusyId(id); setNotice("");
    try {
      const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not delete this scan.");
      setScans((current) => current.filter((scan) => scan.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "We could not delete this scan."); }
    finally { setBusyId(""); }
  }

  const detailResult = selected ? savedResult(selected, selected.disclaimer || DISCLAIMER_TEXT) : null;
  return <main className="page-shell mx-auto max-w-5xl"><AppHeader/>
    <section className="mx-auto max-w-3xl pb-5 pt-8 sm:pt-12"><p className="text-xs font-semibold uppercase tracking-[.12em] text-secondary">Your meal notes</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">History</h1><p className="mt-2 text-sm leading-6 text-secondary">Open a scan to revisit the saved estimate and meal details.</p></section>
    {notice && <p role="alert" className="mx-auto mb-4 max-w-3xl rounded-[14px] border border-line bg-white p-3 text-sm text-secondary">{notice}</p>}
    <section className="mx-auto max-w-3xl" aria-label="Saved meal scans">
      {loading ? <p className="py-5 text-sm text-secondary">Loading your saved scans…</p> : error ? <div className="rounded-[18px] border border-line bg-white p-5"><p role="alert" className="text-sm text-secondary">{error}</p><button onClick={() => window.location.reload()} className="mt-3 min-h-11 rounded-[14px] px-3 text-sm font-semibold text-primary hover:bg-blue-light">Try again</button></div> : scans.length === 0 ? <div className="rounded-[18px] border border-line bg-white px-5 py-7"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-light text-primary"><AppIcon name="history" size={22}/></span><h2 className="mt-4 text-lg font-semibold">Your first scan will appear here.</h2><p className="mt-1 max-w-lg text-sm leading-5 text-secondary">Save a meal scan to keep its estimate and the details you confirmed.</p><Link href="/scan" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Scan a meal<AppIcon name="arrow" size={17}/></Link></div> : <ol className="divide-y divide-line border-y border-line bg-white">{scans.map((scan) => <li key={scan.id} className="flex items-center gap-2 px-3 py-2 sm:px-4">
        <button type="button" onClick={() => void openScan(scan.id)} className="min-h-[76px] min-w-0 flex-1 py-3 text-left hover:text-primary" aria-label={`Open saved scan ${scan.meal_name || "meal"}`}>
          <span className="block truncate text-base font-semibold">{scan.meal_name || "Saved meal scan"}</span><span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary"><time dateTime={scan.created_at}>{new Date(scan.created_at).toLocaleString()}</time><span aria-hidden="true">·</span><span className="capitalize">{scan.meal_impact ?? "Needs a check"}</span></span>
          {(scan.total_carbs_g || scan.sugar_spoons) && <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span><span className="text-secondary">Carbohydrate </span><strong>{scan.total_carbs_g ? formatRange(scan.total_carbs_g, "g") : "Not available"}</strong></span>{scan.sugar_spoons && <span><span className="text-secondary">Carb spoons </span><strong>{formatRange(scan.sugar_spoons, "spoons")}</strong></span>}</span>}
        </button>
        <button type="button" onClick={() => void deleteScan(scan.id)} disabled={busyId === scan.id} aria-label={`Delete saved scan ${scan.meal_name || "meal"}`} className="grid min-h-11 min-w-11 place-items-center rounded-[14px] text-secondary hover:bg-background hover:text-ink disabled:opacity-50"><AppIcon name="trash" size={18}/></button>
      </li>)}</ol>}
    </section>

    {scans.some((scan) => scan.total_carbs_g || scan.sugar_spoons || scan.meal_impact) && <p className="mx-auto mt-4 max-w-3xl text-[13px] leading-[19px] text-secondary">{DISCLAIMER_TEXT}</p>}
    {detailLoading && <p role="status" className="mt-4 text-center text-sm text-secondary">Opening saved result…</p>}
    {selected && detailResult && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 sm:items-center sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="saved-result-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[18px] bg-background p-4 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-[18px] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Saved result · {new Date(selected.created_at).toLocaleString()}</p><h2 id="saved-result-title" className="mt-1 text-xl font-semibold">{selected.components?.[0]?.food ?? "Meal scan"}</h2></div><button type="button" autoFocus onClick={() => setSelected(null)} aria-label="Close saved result" className="grid min-h-11 min-w-11 place-items-center rounded-[14px] border border-line bg-white text-secondary"><AppIcon name="close" size={19}/></button></div>
        <MealImpactCard result={detailResult}/>
        <SavedComponentList components={detailResult.components}/>
        {selected.buffer_actions && selected.buffer_actions.length > 0 && <BufferActions actions={selected.buffer_actions}/>}
      </section>
    </div>}
  </main>;
}
