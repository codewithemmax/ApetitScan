"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";

interface HistoryScan { id: string; created_at: string; meal_impact: string | null; }

export default function HistoryPage() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void fetch("/api/history").then((response) => response.ok ? response.json() as Promise<{ scans: HistoryScan[] }> : Promise.reject()).then((payload) => setScans(payload.scans)).catch(() => setScans([])).finally(() => setLoading(false)); }, []);
  return <main className="page-shell min-h-screen px-5 py-6 md:px-8"><div className="mx-auto max-w-5xl"><AppHeader />
    <section className="pb-10 pt-14"><p className="eyebrow text-coral">Your history</p><h1 className="display-face mt-4 text-5xl md:text-7xl">Saved meal scans.</h1><p className="mt-5 max-w-lg text-base leading-7 text-ink/65">Your previous scan results will appear here.</p></section>
    {loading ? <div className="rounded-3xl bg-white/70 p-8 text-sm text-ink/60">Opening your history...</div> : scans.length === 0 ? <section className="rounded-[2rem] border border-ink/10 bg-white/65 px-7 py-12 text-center"><h2 className="display-face text-4xl">No scans yet.</h2><Link href="/scan" className="mt-7 inline-flex rounded-full bg-plum px-6 py-3 text-sm font-semibold text-paper">Scan a meal</Link></section> : <section className="grid gap-4 md:grid-cols-2">{scans.map((scan) => <article key={scan.id} className="rounded-2xl border border-ink/10 bg-white/75 p-6"><p className="eyebrow text-moss">{scan.meal_impact ?? "Pending estimate"}</p><time className="mt-3 block text-sm text-ink/55" dateTime={scan.created_at}>{new Date(scan.created_at).toLocaleDateString()}</time></article>)}</section>}
  </div></main>;
}