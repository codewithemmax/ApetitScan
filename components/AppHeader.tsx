"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

const links = [
  { href: "/home", label: "Home" },
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-5">
    <Link href="/home" className="text-xl font-black tracking-[-.06em]">Petit<span className="text-coral">Scan</span><span className="ml-2 align-top text-[9px] tracking-[.18em] text-ink/40">NG</span></Link>
    <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full border border-ink/10 bg-white/65 p-1 sm:order-2 sm:w-auto">{links.map((link) => <Link key={link.href} href={link.href} className={`rounded-full px-4 py-2 text-xs font-bold transition ${pathname === link.href ? "bg-ink text-paper" : "text-ink/55 hover:bg-[#e5eef8] hover:text-ink"}`}>{link.label}</Link>)}</nav>
    <button onClick={signOut} className="order-2 rounded-full px-3 py-2 text-xs font-bold text-coral transition hover:bg-coral/10 sm:order-3">Sign out</button>
  </header>;
}
