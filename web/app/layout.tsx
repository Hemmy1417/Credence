import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Credence — On-chain Identity Verification",
  description:
    "Prove you control a social account and link it to your wallet — verified by a GenLayer AI jury, not a central database.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-white/10">
          <nav className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-brand/20 text-brand">✓</span>
              <span>Credence</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link href="/verify" className="px-3 py-2 rounded-lg hover:bg-white/5">Verify</Link>
              <Link href="/registry" className="px-3 py-2 rounded-lg hover:bg-white/5">Registry</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 text-xs text-white/40">
          <div className="mx-auto max-w-5xl px-5 py-6">
            Credence runs on GenLayer Studionet. Verdicts are decided on-chain by an AI validator panel.
          </div>
        </footer>
      </body>
    </html>
  );
}
