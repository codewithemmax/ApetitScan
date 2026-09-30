"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { AppIcon, type AppIconName } from "./AppIcon";

const links = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return <>
    <header className="relative z-20 flex min-h-16 items-center justify-between gap-4 border-b border-line bg-background py-3">
      <Link href="/home" aria-label="ApetitScan home" className="text-lg font-bold tracking-[-.045em]">Apetit<span className="text-primary">Scan</span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-[14px] px-3 text-sm font-semibold transition-colors ${pathname === link.href ? "bg-blue-light text-primary" : "text-secondary hover:bg-white hover:text-ink"}`}><AppIcon name={link.icon as AppIconName} size={18}/>{link.label}</Link>)}</nav>
      <button onClick={signOut} className="min-h-11 rounded-[14px] px-3 text-sm font-semibold text-secondary transition-colors hover:bg-white hover:text-ink">Sign out</button>
    </header>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1 sm:hidden">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${pathname === link.href ? "text-primary" : "text-secondary"}`}><AppIcon name={link.icon as AppIconName} size={20}/>{link.label}</Link>)}</nav>
  </>;
}
