"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { PhotoCapture } from "../../components/PhotoCapture";
import { ResultCard } from "../../components/ResultCard";
import { createClient } from "../../lib/supabase/client";
import type { ScanResult } from "../../lib/types";

export default function ScanPage() {
  const [allergens, setAllergens] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("allergy_profiles").select("allergen").eq("user_id", user.id);
      setAllergens((data ?? []).map((row) => row.allergen));
      setLoading(false);
    })();
  }, []);

  function handleResult(raw: unknown, image: string) {
    setResult(raw as ScanResult);
    setPreview(image);
    window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return <main className="min-h-screen px-5 py-8 md:px-8"><div className="mx-auto max-w-3xl"><AppHeader /><section className="mt-12"><p className="text-sm font-bold uppercase tracking-[.18em] text-coral">New scan</p><h1 className="mt-3 text-4xl font-black">Ask before you eat.</h1><p className="mt-3 max-w-xl leading-7 text-ink/65">Your scan will be saved to your private history, with the questions generated for your profile.</p></section>{loading ? <p className="mt-8 animate-pulse rounded-2xl bg-white p-5 text-sm text-ink/60">Loading your allergy profile…</p> : <div className="mt-8"><PhotoCapture profileId={userId} allergens={allergens} onResult={handleResult} /></div>}{result && <div id="result"><ResultCard result={result} preview={preview} /></div>}</div></main>;
}
