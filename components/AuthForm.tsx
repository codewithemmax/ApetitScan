"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(searchParams.get("error") ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) setMessage(error.message);
      else if (data.session && data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, display_name: displayName });
        window.location.assign("/home");
      } else setMessage("Check your email to confirm your account, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.assign(searchParams.get("next") ?? "/home");
    }
    setLoading(false);
  }

  return <form onSubmit={submit} className="mt-8 space-y-4">
    {mode === "signup" && <label className="block"><span className="mb-2 block text-sm font-semibold">Display name</span><input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-[#cbd5c2] bg-white px-4 py-3 outline-none focus:border-moss" /></label>}
    <label className="block"><span className="mb-2 block text-sm font-semibold">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#cbd5c2] bg-white px-4 py-3 outline-none focus:border-moss" /></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold">Password</span><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#cbd5c2] bg-white px-4 py-3 outline-none focus:border-moss" /></label>
    {message && <p className="rounded-xl bg-[#fff0c7] p-3 text-sm text-[#765900]">{message}</p>}
    <button disabled={loading} className="w-full rounded-xl bg-moss px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
  </form>;
}
