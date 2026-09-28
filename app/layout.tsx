import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "PetitScan — Field notes for the Nigerian table", description: "Understand familiar Nigerian dishes and find useful questions to ask the cook." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
