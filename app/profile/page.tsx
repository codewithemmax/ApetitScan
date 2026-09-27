"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const allergenOptions = ["peanut", "shellfish", "dairy", "egg", "gluten"];

export default function ProfilePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase.from("allergy_profiles").select("allergen").eq("user_id", user.id);
    setSelected((data ?? []).map((row) => row.allergen));
    setLoading(false);
  }

  async function toggle(allergen: string) {
    if (!userId) return;
    setMessage("");
    if (selected.includes(allergen)) {
      const { error } = await supabase.from("allergy_profiles").delete().eq("user_id", userId).eq("allergen", allergen);
      if (!error) setSelected((current) => current.filter((item) => item !== allergen));
      else setMessage("We could not update your profile.");
    } else {
      const { error } = await supabase.from("allergy_profiles").insert({ user_id: userId, allergen });
      if (!error) setSelected((current) => [...current, allergen]);
      else setMessage("We could not update your profile.");
    }
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign("/"); }

  return <main className="min-h-screen px-5 py-8 md:px-8"><div className="mx-auto max-w-2xl"><header className="flex items-center justify-between"><Link href="/home" className="text-xl font-black">Petit<span className="text-moss">Scan</span></Link><button onClick={signOut} className="text-sm font-semibold text-coral">Log out</button></header><section className="mt-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-coral">Your profile</p><h1 className="mt-3 text-4xl font-black">What should we check for?</h1><p className="mt-3 leading-7 text-ink/65">Choose the allergens you want included in future scans. Recipes vary, so PetitScan gives you a question to ask the cook for every flagged ingredient.</p></section><section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm md:p-8">{loading ? <p className="text-sm text-ink/60">Loading your profile…</p> : <div className="grid gap-3 sm:grid-cols-2">{allergenOptions.map((allergen) => <button key={allergen} onClick={() => void toggle(allergen)} className={`rounded-2xl border px-4 py-4 text-left font-semibold capitalize transition ${selected.includes(allergen) ? "border-moss bg-[#e8efdf] text-moss" : "border-[#dce5d5] bg-white"}`}><span className="mr-3">{selected.includes(allergen) ? "✓" : "○"}</span>{allergen === "shellfish" ? "Shellfish / crayfish" : allergen}</button>)}</div>}{message && <p className="mt-4 text-sm text-coral">{message}</p>}</section></div></main>;
}
