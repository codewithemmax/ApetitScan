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

  return <main className="page-shell"><div className="mx-auto max-w-[1320px]"><AppHeader /><section className="rise-in mb-8 mt-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-end"><div><p className="eyebrow text-coral">Kitchen note / New scan</p><h1 className="display-face mt-3 text-5xl leading-[.94] md:text-7xl">A closer look<br/><em className="text-moss">at your plate.</em></h1></div><p className="max-w-sm pb-1 text-sm leading-6 text-ink/55">Your scan is saved privately. We compare the dish with your profile and prepare clear questions for the cook.</p></section><div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">{loading ? <div className="animate-pulse rounded-[2rem] bg-white p-10 text-sm text-ink/55">Preparing your scan…</div> : <PhotoCapture profileId={userId} allergens={allergens} onResult={handleResult} />}<aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{[{no:"01",title:"Photograph",body:"Frame the dish in good light."},{no:"02",title:"Identify",body:"We look in the verified dish library first."},{no:"03",title:"Ask",body:"Take a plain-language question to the cook."}].map((step)=><article key={step.no} className="rounded-2xl border border-ink/10 bg-white/55 p-5"><span className="display-face text-3xl text-coral">{step.no}</span><h2 className="mt-3 font-bold">{step.title}</h2><p className="mt-1 text-xs leading-5 text-ink/55">{step.body}</p></article>)}</aside></div>{result && <div id="result"><ResultCard result={result} preview={preview} /></div>}</div></main>;
}
