import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import Link from "next/link";
import { CredenceWordmark } from "@/components/Logo";
import { ConnectButton } from "@/components/ConnectButton";
import { ConfigNotice } from "@/components/ConfigNotice";
import { WalletProvider } from "@/lib/wallet";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Credence — On-chain Identity Verification",
  description:
    "Prove you control a social account and link it to your wallet — sealed on-chain by a GenLayer AI validator panel, not a central database.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/verify", label: "Verify" },
  { href: "/registry", label: "Registry" },
  { href: "/developers", label: "Developers" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <WalletProvider>
          <header className="sticky top-0 z-20 backdrop-blur-md bg-black/60 border-b border-gold/15">
            <nav className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
              <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
                <CredenceWordmark />
              </Link>
              <div className="flex items-center gap-1 text-sm">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="display tracking-[0.16em] text-xs px-3 py-2 text-foreground/70 hover:text-gold-bright transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
                <span className="ml-2">
                  <ConnectButton />
                </span>
              </div>
            </nav>
          </header>
          <main className="flex-1 relative z-10">
            <ConfigNotice />
            {children}
          </main>
          <footer className="border-t border-gold/15 relative z-10">
            <div className="mx-auto max-w-6xl px-5 py-7 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/40">
              <span className="eyebrow text-[0.65rem] text-gold/70">Sealed on GenLayer</span>
              <span>Verdicts decided on-chain by an AI validator panel · Studionet</span>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
