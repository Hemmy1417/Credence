// Public lookup API: GET /api/verified/{address}
// Returns a wallet's Credence Score + verified identities. CORS-open so any dApp
// can gate on it:  const { verified, score } = await (await fetch(`${BASE}/api/verified/${addr}`)).json()
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { computeScore } from "@/lib/score";

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

async function identitiesOf(address: string): Promise<Rec[]> {
  try {
    const client = createClient({ chain: studionet, account: createAccount(generatePrivateKey()) });
    const raw = (await client.readContract({
      address: CONTRACT,
      functionName: "get_identities_by_address",
      args: [address],
    })) as unknown;
    const s = typeof raw === "string" ? raw : "";
    return s ? (JSON.parse(s) as Rec[]) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const all = await identitiesOf(address);
  const verifiedList = all.filter((i) => i.status === "VERIFIED");
  const { score, tier } = computeScore(all);

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
