import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* hero */}
      <section className="py-20 text-center">
        <p className="inline-block text-xs font-medium tracking-wide uppercase text-brand-2/90 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          On-chain identity verification
        </p>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
          Prove your social identity,
          <br />
          <span className="text-brand">linked to your wallet.</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-white/60 text-lg">
          Request a one-time code, post it publicly, and a GenLayer AI jury verifies it&apos;s
          really you — then writes the link on-chain. No central authority, no &quot;trust me&quot; badge.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/verify"
            className="px-5 py-3 rounded-xl bg-brand text-white font-medium hover:opacity-90"
          >
            Verify my identity
          </Link>
          <Link href="/registry" className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/5">
            Browse the registry
          </Link>
        </div>
      </section>

      {/* how it works */}
      <section className="pb-20 grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Request a code", d: "Get a unique code tied to your wallet address." },
          { n: "2", t: "Post it publicly", d: "Drop the code in a public GitHub gist (or any public URL)." },
          { n: "3", t: "AI jury verifies", d: "GenLayer validators read it, agree, and link it on-chain." },
        ].map((s) => (
          <div key={s.n} className="card p-6">
            <div className="w-8 h-8 grid place-items-center rounded-lg bg-brand/20 text-brand font-semibold">
              {s.n}
            </div>
            <h3 className="mt-4 font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-white/55">{s.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
