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

  const fieldClass = "min-h-12 w-full rounded-[14px] border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

  return <form onSubmit={submit} className="mt-8 space-y-5">
    {mode === "signup" && <label className="block"><span className="eyebrow mb-2 block text-ink/60">Display name</span><input autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={fieldClass} /></label>}
    <label className="block"><span className="eyebrow mb-2 block text-ink/60">Email address</span><input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></label>
    <label className="block"><span className="eyebrow mb-2 block text-ink/60">Password</span><input autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} /></label>
    {message && <p role="alert" className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{message}</p>}
    <button disabled={loading} className="group flex min-h-12 w-full items-center justify-between rounded-[14px] bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"><span>{loading ? "Please wait..." : mode === "signup" ? "Create your account" : "Log in"}</span><span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">↗</span></button>
  </form>;
}
