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

  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
    <Link href="/home" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-moss text-lg">🥜</span>Petit<span className="text-moss">Scan</span></Link>
    <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1 sm:order-2 sm:w-auto">{links.map((link) => <Link key={link.href} href={link.href} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === link.href ? "bg-moss text-white shadow-sm" : "text-ink/60 hover:bg-cream hover:text-ink"}`}>{link.label}</Link>)}</nav>
    <button onClick={signOut} className="order-2 text-sm font-semibold text-coral transition hover:text-ink sm:order-3">Log out</button>
  </header>;
}
