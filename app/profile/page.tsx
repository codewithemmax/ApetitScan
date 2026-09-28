"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { createClient } from "../../lib/supabase/client";

const allergenOptions = ["peanut", "shellfish", "dairy", "egg", "gluten"];

export default function ProfilePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const { data, error } = await supabase.from("allergy_profiles").select("allergen").eq("user_id", user.id);
    if (error) setMessage("We could not load your preferences. Please refresh to try again.");
    else setSelected((data ?? []).map((row) => row.allergen));
    setLoading(false);
  }

  async function toggle(allergen: string) {
    if (!userId) return;
    setMessage("");
    if (selected.includes(allergen)) {
      const { error } = await supabase.from("allergy_profiles").delete().eq("user_id", userId).eq("allergen", allergen);
      if (!error) setSelected((current) => current.filter((item) => item !== allergen));
      else setMessage("We could not update your profile. Please try again.");
    } else {
      const { error } = await supabase.from("allergy_profiles").insert({ user_id: userId, allergen });
      if (!error) setSelected((current) => [...current, allergen]);
      else setMessage("We could not update your profile. Please try again.");
    }
  }

  return <main className="page-shell min-h-screen px-5 py-6 md:px-8">
    <div className="mx-auto max-w-5xl"><AppHeader />
      <section className="relative mt-10 overflow-hidden rounded-[2rem] bg-plum px-7 py-9 text-paper md:px-12 md:py-14">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-paper/10 md:h-80 md:w-80" />
        <div aria-hidden="true" className="absolute -right-2 -top-6 h-36 w-36 rounded-full border border-paper/10 md:right-8 md:top-8 md:h-48 md:w-48" />
        <div className="relative max-w-2xl"><p className="eyebrow text-citron">Your preferences</p><h1 className="display-face mt-4 text-5xl leading-[.98] md:text-7xl">A little more<br />personal.</h1><p className="mt-5 max-w-lg text-sm leading-6 text-paper/70 md:text-base">Choose the allergens you want PetitScan to look out for. Every flagged ingredient comes with a question you can ask the cook.</p></div>
        <div className="relative mt-8 flex items-center gap-3"><span className="display-face text-4xl text-citron">{selected.length.toString().padStart(2, "0")}</span><span className="text-xs uppercase leading-5 tracking-[.16em] text-paper/60">preferences<br />selected</span></div>
      </section>

      <section className="grid gap-8 py-10 md:grid-cols-[.8fr_1.2fr] md:py-14">
        <div><p className="eyebrow text-coral">Your watchlist</p><h2 className="display-face mt-3 text-3xl">What should we check for?</h2><p className="mt-3 text-sm leading-6 text-ink/60">Your choices shape the flags shown with each dish. Ingredients and kitchen practices vary, so always confirm with the person preparing your meal.</p><div className="mt-6 flex items-start gap-3 rounded-2xl border border-ink/10 bg-white/50 p-4"><span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-coral" /><p className="text-xs leading-5 text-ink/60">PetitScan offers food information, not a guarantee of safety or a substitute for medical advice.</p></div></div>
        <div className="rounded-[1.75rem] border border-ink/10 bg-white/75 p-5 md:p-7">
          {loading ? <div className="space-y-3" aria-label="Loading preferences"><div className="h-16 animate-pulse rounded-2xl bg-ink/5" /><div className="h-16 animate-pulse rounded-2xl bg-ink/5" /><div className="h-16 animate-pulse rounded-2xl bg-ink/5" /></div> : <div className="grid gap-3 sm:grid-cols-2">{allergenOptions.map((allergen, index) => {
            const active = selected.includes(allergen);
            const names: Record<string, string> = { shellfish: "Shellfish & crayfish" };
            return <button key={allergen} aria-pressed={active} onClick={() => void toggle(allergen)} className={`group min-h-24 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${active ? "border-plum bg-plum text-paper shadow-md shadow-plum/10" : "border-ink/10 bg-paper/60 hover:border-moss/40 hover:bg-[#e4f1ff]"}`}>
              <span className="flex items-center justify-between"><span className={`eyebrow ${active ? "text-citron" : "text-moss"}`}>0{index + 1}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] ${active ? "bg-citron text-ink" : "bg-ink/5 text-ink/45"}`}>{active ? "Selected" : "Add"}</span></span>
              <span className="mt-4 block text-base font-semibold capitalize">{names[allergen] ?? allergen}</span>
            </button>;
          })}</div>}
          {message && <p role="alert" className="mt-4 rounded-xl bg-[#fff0e9] p-3 text-sm text-coral">{message}</p>}
          <p className="mt-5 border-t border-ink/10 pt-4 text-xs leading-5 text-ink/45">Changes are saved to your profile as you select them.</p>
        </div>
      </section>
      <footer className="pb-10 text-center text-xs text-ink/45">Your choices stay in your account.</footer>
    </div>
  </main>;
}
