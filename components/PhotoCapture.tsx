"use client";

import { ChangeEvent, FormEvent, useState } from "react";

export function PhotoCapture({ onResult, profileId, allergens }: { onResult: (result: unknown, preview: string) => void; profileId: string; allergens: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [dish, setDish] = useState("Egusi soup");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("Identifying dish…");
  const [error, setError] = useState("");

  function choose(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setError(""); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) { setError("Choose a photo before scanning."); return; }
    setLoading(true); setStage("Identifying dish…"); setError("");
    const stageTimer = window.setTimeout(() => setStage("Checking ingredients…"), 700);
    const form = new FormData(); form.append("image", file); form.append("dish", dish); form.append("profileId", profileId); form.append("allergens", JSON.stringify(allergens));
    try { const response = await fetch("/api/scan", { method: "POST", body: form }); if (!response.ok) throw new Error(); setStage("Checking ingredients…"); onResult(await response.json(), URL.createObjectURL(file)); }
    catch { setError("That scan did not come through. Please try again."); }
    finally { window.clearTimeout(stageTimer); setLoading(false); }
  }

  return <form onSubmit={submit} className="overflow-hidden rounded-[2rem] border border-[#d6e5f3] bg-[#eaf3fc] p-2 shadow-xl shadow-blue/10">
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 pt-4 md:px-6"><div><p className="text-[11px] font-black uppercase tracking-[.24em] text-coral">Plate scan / 01</p><h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Bring the plate into focus.</h2></div><span className="rounded-full border border-moss/20 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-moss">Verified library</span></div>
    <div className="grid gap-2 md:grid-cols-[1.1fr_.9fr]">
      <label className="group flex min-h-64 cursor-pointer flex-col justify-between rounded-[1.5rem] bg-ink p-5 text-white transition hover:bg-navy md:min-h-72"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.2em] text-white/50"><span>Photo input</span><span className="h-2 w-2 rounded-full bg-sky" /></div><div><span className="block text-5xl font-extralight leading-none text-sky">+</span><span className="mt-4 block text-lg font-bold">{file ? file.name : "Choose a meal photo"}</span><span className="mt-1 block max-w-xs text-sm leading-6 text-white/55">Use your camera or upload a clear view of the dish.</span></div><input type="file" accept="image/*" capture="environment" onChange={choose} className="hidden" /></label>
      <div className="flex flex-col rounded-[1.5rem] bg-white p-5"><div><label className="mb-2 block text-[10px] font-black uppercase tracking-[.2em] text-ink/45">Demo recognition</label><select value={dish} onChange={(event) => setDish(event.target.value)} className="w-full rounded-xl border border-[#dce5d5] bg-cream px-3 py-3 text-sm font-semibold text-ink outline-none transition focus:border-moss"><option>Egusi soup</option><option>Jollof rice</option><option>Moin moin</option><option>Something else (Estimated)</option></select></div><div className="mt-auto pt-8"><p className="mb-3 text-xs leading-5 text-ink/50">Your profile will shape the questions we return for this scan.</p>{error && <p className="mb-3 text-sm text-coral">{error}</p>}<button disabled={loading} aria-live="polite" className="w-full rounded-xl bg-moss px-4 py-3.5 text-sm font-bold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-60">{loading ? stage : "Scan this meal"}</button></div></div>
    </div>
  </form>;
}
