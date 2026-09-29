import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";

export default function HomePage() {
  return <main className="page-shell min-h-screen px-5 py-6 md:px-8"><div className="mx-auto max-w-5xl"><AppHeader />
    <section className="rise-in mt-10 rounded-[2rem] bg-plum px-7 py-10 text-paper md:px-12 md:py-16">
      <p className="eyebrow text-sky">ApetitScan / Your table</p>
      <h1 className="display-face mt-4 max-w-3xl text-5xl leading-[.94] md:text-7xl">One photo.<br/><em className="text-sky">Better context.</em></h1>
      <p className="mt-6 max-w-xl text-sm leading-7 text-paper/70 md:text-base">Scan a meal, confirm what needs clarification, and keep an honest estimate in your history.</p>
      <Link href="/scan" className="mt-8 inline-flex rounded-full bg-coral px-6 py-3.5 text-sm font-bold text-white">Scan a meal <span className="ml-3">↗</span></Link>
    </section>
    <section className="mt-5 grid gap-4 md:grid-cols-2"><Link href="/history" className="rounded-2xl border border-ink/10 bg-white/70 p-6 transition hover:bg-white"><p className="eyebrow text-coral">Your history</p><h2 className="display-face mt-3 text-3xl">Saved scans</h2><p className="mt-2 text-sm leading-6 text-ink/60">Return to previous meal estimates and notes.</p></Link><Link href="/profile" className="rounded-2xl border border-ink/10 bg-ice p-6 transition hover:bg-white"><p className="eyebrow text-moss">Your account</p><h2 className="display-face mt-3 text-3xl">Profile</h2><p className="mt-2 text-sm leading-6 text-ink/60">Manage your account details.</p></Link></section>
  </div></main>;
}