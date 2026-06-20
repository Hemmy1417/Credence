// Live, embeddable "Verified by Credence" badge (SVG).
// Reads the contract server-side and renders a black+gold badge. Drop it in a
// README:  [![Verified by Credence](https://HOST/api/badge/github/you)](https://HOST/u/github/you)
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function isVerified(platform: string, handle: string): Promise<boolean> {
  try {
    const account = createAccount(generatePrivateKey());
    const client = createClient({ chain: studionet, account });
    const raw = (await client.readContract({
      address: CONTRACT,
      functionName: "get_identity",
      args: [platform, handle],
    })) as unknown;
    const s = typeof raw === "string" ? raw : "";
    if (!s) return false;
    const rec = JSON.parse(s);
    return rec?.status === "VERIFIED";
  } catch {
    return false;
  }
}

function svg(label: string, verified: boolean): string {
  const gold = "#d4af6a";
  const goldB = "#f0d491";
  const text = `${verified ? "Verified by Credence" : "Unverified on Credence"} · ${label}`;
  const accent = verified ? gold : "#7b7b7b";
  const w = 56 + Math.ceil(text.length * 6.9);
  const h = 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${esc(text)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${goldB}"/><stop offset="0.5" stop-color="${gold}"/><stop offset="1" stop-color="#a9803a"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="#050505" stroke="${accent}" stroke-opacity="0.55"/>
  <g transform="translate(10,7)">
    <path d="M8 0 L15 4 V12 L8 16 L1 12 V4 Z" fill="none" stroke="url(#g)" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M5 8 L7 10 L11 5.5" fill="none" stroke="url(#g)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="34" y="20" font-family="Verdana,Segoe UI,sans-serif" font-size="12" font-weight="600" fill="${verified ? "#f3efe6" : "#9a9a9a"}">${esc(text)}</text>
</svg>`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ platform: string; handle: string }> },
) {
  const { platform, handle } = await params;
  const p = decodeURIComponent(platform).toLowerCase();
  const h = decodeURIComponent(handle).toLowerCase().replace(/^@/, "");
  const verified = await isVerified(p, h);
  const body = svg(`${p}/${h}`, verified);
  return new Response(body, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
