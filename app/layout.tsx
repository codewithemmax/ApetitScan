import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "PetitScan — ask before you eat", description: "A tiny lens for Nigerian food allergens." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
