"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Flag, Source } from "../../lib/types";

interface HistoryScan { id: string; matched_dish: string | null; flags: Flag[]; source: Source; created_at: string; }

export default function HistoryPage() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() { const response = await fetch("/api/history"); if (!response.ok) { setError("We could not load your scan history."); setLoading(false); return; } const payload = await response.json() as { scans: HistoryScan[] }; setScans(payload.scans); setLoading(false); }
  useEffect(() => { void load(); }, []);
  async function remove(id: string) { const response = await fetch(`/api/history/${id}`, { method: "DELETE" }); if (response.ok) setScans((current) => current.filter((scan) => scan.id !== id)); }

  return <main className="min-h-screen px-5 py-8 md:px-8"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between"><Link href="/home" className="text-xl font-black">Petit<span className="text-moss">Scan</span></Link><Link href="/scan" className="rounded-xl bg-moss px-4 py-2 text-sm font-bold text-white">New scan</Link></header><section className="mt-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-coral">Your history</p><h1 className="mt-3 text-4xl font-black">Questions worth keeping.</h1></section>{loading ? <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-ink/60">Loading your scans…</p> : error ? <p className="mt-8 rounded-2xl bg-[#fff0c7] p-6 text-sm text-[#765900]">{error}</p> : scans.length === 0 ? <div className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-sm"><p className="text-4xl">🍲</p><h2 className="mt-4 text-xl font-bold">No scans yet</h2><p className="mt-2 text-sm leading-6 text-ink/60">Your saved dish questions will show up here after your first scan.</p><Link href="/scan" className="mt-5 inline-block rounded-xl bg-moss px-5 py-3 text-sm font-bold text-white">Scan a dish</Link></div> : <div className="mt-8 space-y-3">{scans.map((scan) => <article key={scan.id} className="rounded-2xl bg-white p-5 shadow-sm"><button onClick={() => setOpen(open === scan.id ? null : scan.id)} className="flex w-full items-center justify-between gap-4 text-left"><div><p className="text-lg font-bold">{scan.matched_dish ?? "Unidentified Nigerian dish"}</p><p className="mt-1 text-xs text-ink/50">{new Date(scan.created_at).toLocaleString()} · {scan.source === "cache" ? "Verified" : "Estimated"}</p></div><span className="text-xl text-moss">{open === scan.id ? "−" : "+"}</span></button>{open === scan.id && <div className="mt-5 border-t border-[#edf0e9] pt-4">{scan.flags.length ? <div className="space-y-3">{scan.flags.map((flag) => <div key={`${flag.allergen}-${flag.ingredient}`} className="rounded-xl bg-[#fff9f7] p-3 text-sm"><p className="font-semibold capitalize">{flag.allergen} · {flag.ingredient}</p><p className="mt-1 text-coral">Ask the cook: <span className="text-ink">“{flag.question}”</span></p></div>)}</div> : <p className="text-sm text-ink/60">No profile flags were stored for this scan.</p>}<button onClick={() => void remove(scan.id)} className="mt-4 text-sm font-semibold text-coral">Delete this scan</button></div>}</article>)}</div>}</div></main>;
}
