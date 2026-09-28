import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export default function LoginPage() {
  return <main className="page-shell"><div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 shadow-xl shadow-ink/5 md:min-h-[720px] md:grid-cols-[1fr_.9fr]">
    <section className="paper-grid relative flex flex-col justify-between bg-ice p-7 md:p-12"><Link href="/" className="text-xl font-black tracking-[-.06em]">Petit<span className="text-coral">Scan</span></Link><div className="my-16 max-w-lg"><p className="eyebrow text-ink/50">A field guide to your plate</p><h1 className="display-face mt-5 text-6xl leading-[.92] md:text-7xl">Welcome back<br/><em>to the table.</em></h1><p className="mt-5 max-w-sm text-sm leading-6 text-ink/65">Pick up where you left off. Your questions and dish notes are waiting.</p></div><p className="eyebrow text-ink/40">PetitScan · Nigerian food, understood together</p></section>
    <section className="flex items-center p-7 md:p-14"><div className="w-full max-w-md"><p className="eyebrow text-coral">Your notebook</p><h2 className="display-face mt-3 text-4xl">Log in</h2><p className="mt-2 text-sm text-ink/55">Use the email and password linked to your account.</p><AuthForm mode="login"/><p className="mt-7 text-sm text-ink/55">New to PetitScan? <Link href="/signup" className="font-bold text-coral">Create an account</Link></p></div></section>
  </div></main>;
}
