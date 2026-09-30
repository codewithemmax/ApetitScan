import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export default function LoginPage() {
  return <main className="page-shell">
    <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-line pb-4"><Link href="/" className="text-lg font-bold tracking-tight">Apetit<span className="text-primary">Scan</span></Link><Link href="/signup" className="min-h-11 inline-flex items-center rounded-[14px] px-3 text-sm font-semibold text-secondary hover:bg-white">Create account</Link></header>
    <section className="mx-auto mt-8 max-w-md rounded-[18px] border border-line bg-white p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Your meal notes</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm leading-5 text-secondary">Log in to review and save your meal scans.</p><Suspense><AuthForm mode="login"/></Suspense><p className="mt-6 text-sm text-secondary">New to ApetitScan? <Link href="/signup" className="font-semibold text-primary">Create an account</Link></p></section>
  </main>;
}
