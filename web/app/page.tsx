import Link from "next/link";
import { CredenceMark } from "@/components/Logo";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* hero */}
      <section className="relative pt-24 pb-20 text-center">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-gold/20 rounded-full" />
            <CredenceMark size={72} />
          </div>
        </div>

        <p className="eyebrow text-[0.7rem] text-gold/80">On-chain Identity Verification</p>

        <h1 className="display mt-6 text-5xl sm:text-7xl">
          Prove who you are.
          <br />
          <span className="gold-text">Seal it on-chain.</span>
        </h1>

        <p className="mt-7 max-w-2xl mx-auto text-foreground/55 text-lg leading-relaxed">
          Request a one-time code, post it publicly, and a panel of AI validators verifies it&apos;s
          really you — then links your social identity to your wallet, permanently and trustlessly.
          No central authority. No &quot;trust me&quot; badge.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/verify" className="btn-gold notch px-7 py-3.5 text-sm">
            Verify my identity
          </Link>
          <Link href="/registry" className="btn-ghost notch px-7 py-3.5 text-sm">
            Browse the registry
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-foreground/35">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok pulse-gold" /> Live on GenLayer Studionet
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Multi-model AI consensus</span>
        </div>
      </section>

      {/* how it works */}
      <section className="pb-10">
        <div className="hairline mb-10" />
        <p className="eyebrow text-[0.7rem] text-foreground/40 text-center mb-8">How it works</p>
        <div className="grid gap-px sm:grid-cols-3 bg-gold/10 border border-gold/15">
          {[
            { n: "01", t: "Request a code", d: "Get a unique code cryptographically tied to your wallet address." },
            { n: "02", t: "Post it publicly", d: "Drop the code in a public GitHub gist — or any public URL you control." },
            { n: "03", t: "AI jury seals it", d: "GenLayer validators read it, reach consensus, and write the link on-chain." },
          ].map((s) => (
            <div key={s.n} className="bg-black p-7 panel-hover">
              <div className="display text-3xl gold-text">{s.n}</div>
              <h3 className="display mt-3 text-lg tracking-[0.06em]">{s.t}</h3>
              <p className="mt-2 text-sm text-foreground/50 leading-relaxed normal-case">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* why it matters */}
      <section className="py-20 grid gap-10 sm:grid-cols-2 items-center">
        <div>
          <p className="eyebrow text-[0.7rem] text-gold/80">Why GenLayer</p>
          <h2 className="display mt-4 text-3xl sm:text-4xl">
            A trust layer no
            <br />
            <span className="gold-text">single party</span> controls.
          </h2>
          <p className="mt-5 text-foreground/55 leading-relaxed">
            A normal smart contract can&apos;t read a webpage or judge whether a post is genuine. A
            normal server could — but then you&apos;d have to trust that server. Credence uses
            GenLayer&apos;s AI-validator consensus so the verification itself is trustless.
          </p>
        </div>
        <div className="panel notch p-7">
          <div className="space-y-5">
            {[
              ["Web-aware", "Validators fetch the live page, not a cached copy."],
              ["AI judgement", "Multiple models independently decide if the proof is real."],
              ["On-chain truth", "The verified link is public state, not a private database row."],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-4">
                <CredenceMark size={22} />
                <div>
                  <div className="display tracking-[0.08em] text-sm">{t}</div>
                  <div className="text-sm text-foreground/50 normal-case">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
