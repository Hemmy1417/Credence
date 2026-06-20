const verifiedExample = `{
  "address": "0x10DbF82A8bb191bd1c082de5Ef915E998Aa5CCD7",
  "verified": true,
  "score": 40,
  "tier": "Trusted",
  "count": 1,
  "identities": [
    { "platform": "github", "handle": "hemmy1417", "confidence": "HIGH", "evidence_uri": "https://gist.github.com/…" }
  ]
}`;

const sdkSnippet = `// credence.ts — drop-in client for any dApp
const BASE = "https://YOUR-CREDENCE-DEPLOYMENT";

export async function getCredence(address: string) {
  const r = await fetch(\`\${BASE}/api/verified/\${address}\`);
  return r.json(); // { verified, score, tier, count, identities }
}

// Sybil-resistant gate: require a verified human before an airdrop / vote / quest
export async function requireVerified(address: string, minScore = 35) {
  const { verified, score } = await getCredence(address);
  if (!verified || score < minScore) throw new Error("Not a verified Credence identity");
}`;

function Code({ children }: { children: string }) {
  return (
    <pre className="panel notch p-4 mt-3 overflow-x-auto text-xs font-mono text-foreground/80 leading-relaxed">
      {children}
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="eyebrow text-[0.7rem] text-gold/80">Build on Credence</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">
        Developer <span className="gold-text">API</span>
      </h1>
      <p className="mt-4 text-foreground/55 leading-relaxed">
        Credence is a composable trust layer. Any app can query whether a wallet controls a verified
        social identity — and how strong that reputation is — with one HTTP call. No keys, CORS-open.
      </p>

      <section className="mt-10">
        <h2 className="display tracking-[0.08em] text-lg">Lookup a wallet</h2>
        <Code>{`GET /api/verified/{address}`}</Code>
        <p className="mt-3 text-sm text-foreground/45 uppercase tracking-wider">Response</p>
        <Code>{verifiedExample}</Code>
      </section>

      <section className="mt-10">
        <h2 className="display tracking-[0.08em] text-lg">Embeddable badge</h2>
        <Code>{`GET /api/badge/{platform}/{handle}   →   live SVG`}</Code>
        <p className="mt-2 text-sm text-foreground/50 normal-case">
          Paste in a README: <span className="font-mono text-gold-bright">{`![Verified by Credence](…/api/badge/github/you)`}</span>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="display tracking-[0.08em] text-lg">Drop-in SDK</h2>
        <Code>{sdkSnippet}</Code>
      </section>

      <section className="mt-10 panel notch p-6">
        <h2 className="display tracking-[0.08em] text-base">The Credence Score</h2>
        <p className="mt-2 text-sm text-foreground/55 normal-case">
          0–100, derived from the number and diversity of verified links, weighted by the AI
          validators&apos; confidence. Tiers: <span className="text-warn">Emerging</span> ·{" "}
          <span className="text-gold">Trusted</span> ·{" "}
          <span className="text-ok">Highly Trusted</span>.
        </p>
      </section>
    </div>
  );
}
