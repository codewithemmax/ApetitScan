import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export default function SignupPage() {
  return <main className="page-shell">
    <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-line pb-4"><Link href="/" className="text-lg font-bold tracking-tight">Apetit<span className="text-primary">Scan</span></Link><Link href="/login" className="min-h-11 inline-flex items-center rounded-[14px] px-3 text-sm font-semibold text-secondary hover:bg-white">Log in</Link></header>
    <section className="mx-auto mt-8 max-w-md rounded-[18px] border border-line bg-white p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Start your meal notes</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Create your account</h1><p className="mt-2 text-sm leading-5 text-secondary">Save scans and return to the details later.</p><Suspense><AuthForm mode="signup"/></Suspense><p className="mt-6 text-sm text-secondary">Already have an account? <Link href="/login" className="font-semibold text-primary">Log in</Link></p></section>
  </main>;
}
