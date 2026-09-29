import Link from "next/link";
import { AppHeader } from "../../components/AppHeader";

export default function ScanPage() {
  return <main className="page-shell min-h-screen px-5 py-6 md:px-8"><div className="mx-auto max-w-5xl"><AppHeader />
    <section className="rise-in mt-10 overflow-hidden rounded-[2rem] bg-plum px-7 py-10 text-paper md:px-12 md:py-16"><p className="eyebrow text-sky">ApetitScan / New scan</p><h1 className="display-face mt-4 max-w-3xl text-5xl leading-[.94] md:text-7xl">Bring your meal<br/><em className="text-sky">into focus.</em></h1><p className="mt-6 max-w-xl text-sm leading-7 text-paper/70 md:text-base">The scan flow will identify food, ask about portion and preparation, and return carbohydrate ranges.</p><Link href="/home" className="mt-8 inline-flex rounded-full bg-coral px-6 py-3.5 text-sm font-bold text-white">Back to home <span className="ml-3">↗</span></Link></section>
    <section className="grid gap-4 py-8 md:grid-cols-3">{[{n:"01",t:"Photograph",d:"Capture a clear view of the meal."},{n:"02",t:"Understand",d:"Confirm food, portion, and preparation when needed."},{n:"03",t:"Act",d:"Get a realistic next step for the meal in front of you."}].map((s)=><article key={s.n} className="rounded-2xl border border-ink/10 bg-white/70 p-5"><span className="display-face text-3xl text-coral">{s.n}</span><h2 className="mt-3 font-bold">{s.t}</h2><p className="mt-1 text-sm leading-6 text-ink/55">{s.d}</p></article>)}</section>
  </div></main>;
}