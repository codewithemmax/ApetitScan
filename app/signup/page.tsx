import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export default function SignupPage() {
  return <main className="page-shell"><div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 shadow-xl shadow-ink/5 md:min-h-[760px] md:grid-cols-[1fr_.9fr]">
    <section className="paper-grid relative flex flex-col justify-between bg-plum p-7 text-paper md:p-12"><Link href="/" className="text-xl font-black tracking-[-.06em]">Petit<span className="text-sky">Scan</span></Link><div className="my-16 max-w-lg"><p className="eyebrow text-sky">Start with what matters to you</p><h1 className="display-face mt-5 text-6xl leading-[.92] md:text-7xl">Make room<br/>for better<br/><em className="text-sky">questions.</em></h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">Build your allergy profile and keep the dish notes you want to revisit.</p></div><p className="eyebrow text-white/35">A small lens on a rich food culture</p></section>
    <section className="flex items-center p-7 md:p-14"><div className="w-full max-w-md"><p className="eyebrow text-coral">Join PetitScan</p><h2 className="display-face mt-3 text-4xl">Create your account</h2><p className="mt-2 text-sm text-ink/55">A few details, then your own food notebook.</p><AuthForm mode="signup"/><p className="mt-7 text-sm text-ink/55">Already have an account? <Link href="/login" className="font-bold text-coral">Log in</Link></p></div></section>
  </div></main>;
}
