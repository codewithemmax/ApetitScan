import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "ApetitScan — Meal estimates, clearly", description: "Review meal foods, portions and preparation, then see a carbohydrate range from verified data." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
