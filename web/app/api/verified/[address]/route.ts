// Public lookup API: GET /api/verified/{address}
// Returns a wallet's Credence Score + verified identities. CORS-open so any dApp
// can gate on it:  const { verified, score } = await (await fetch(`${BASE}/api/verified/${addr}`)).json()
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
const CORS = { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" };

type Rec = {
  platform: string;
  handle: string;
  status: string;
  confidence: string;
  evidence_uri?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function client(): any {
  return createClient({ chain: studionet, account: createAccount(generatePrivateKey()) });
}

async function readJson(functionName: string, args: unknown[], fallback: unknown) {
  try {
    const c = client();
    const raw = (await c.readContract({ address: CONTRACT, functionName, args })) as unknown;
    const s = typeof raw === "string" ? raw : "";
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const all = (await readJson("get_identities_by_address", [address], [])) as Rec[];
  const sc = (await readJson("get_score", [address], { score: 0, tier: "Unverified", links: 0 })) as {
    score: number;
    tier: string;
    links: number;
  };
  const verifiedList = all.filter((i) => i.status === "VERIFIED");
  const score = sc.score;
  const tier = sc.tier;

  return Response.json(
    {
      address,
      verified: verifiedList.length > 0,
      score,
      tier,
      count: verifiedList.length,
      identities: verifiedList.map((i) => ({
        platform: i.platform,
        handle: i.handle,
        confidence: i.confidence,
        evidence_uri: i.evidence_uri ?? "",
      })),
    },
    { headers: CORS },
  );
}
