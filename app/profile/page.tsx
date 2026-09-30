"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import { AppIcon } from "../../components/AppIcon";
import { createClient } from "../../lib/supabase/client";
export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    void createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login?next=%2Fprofile"); return; }
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata.display_name as string | undefined) ?? "ApetitScan user");
    });
  }, [router]);
  return <main className="page-shell mx-auto max-w-5xl"><AppHeader/>
    <section className="mx-auto max-w-2xl py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-secondary">Your account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm leading-6 text-secondary">Account details for your ApetitScan notebook.</p>
      <div className="mt-6 divide-y divide-line border-y border-line bg-white px-4 sm:px-5">
        <div className="flex items-center gap-4 py-5"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-light text-primary"><AppIcon name="user" size={22}/></span><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Display name</p><p className="mt-1 text-base font-semibold">{name || "Loading…"}</p></div></div>
        <div className="py-5"><p className="text-xs font-semibold uppercase tracking-[.1em] text-secondary">Email</p><p className="mt-1 break-all text-base font-semibold">{email || "Loading…"}</p></div>
      </div>
      <p className="mt-4 text-sm leading-5 text-secondary">Your scans are associated with this account. Sign out from the navigation when you are finished.</p>
    </section>
  </main>;
}
