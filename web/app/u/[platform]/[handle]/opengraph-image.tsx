// Dynamic social-share image for a Credence profile. When someone pastes a
// /u/<platform>/<handle> link into X, Discord, Slack, etc., this black+gold card
// renders with the handle, a VERIFIED seal and the on-chain Credence Score.
import { ImageResponse } from "next/og";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const runtime = "nodejs";
export const alt = "Credence verified identity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

function tierColor(tier: string): string {
  switch (tier) {
    case "Highly Trusted":
      return "#7fd1a0";
    case "Trusted":
      return "#d4af6a";
    case "Emerging":
      return "#e6b450";
    default:
      return "#7b7b7b";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function read(fn: string, args: string[]): Promise<any> {
  try {
    const client = createClient({ chain: studionet, account: createAccount(generatePrivateKey()) });
    const raw = (await client.readContract({ address: CONTRACT, functionName: fn, args })) as unknown;
    const s = typeof raw === "string" ? raw : "";
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ platform: string; handle: string }>;
}) {
  const { platform, handle } = await params;
  const p = decodeURIComponent(platform).toLowerCase();
  const h = decodeURIComponent(handle).toLowerCase().replace(/^@/, "");

  const identity = await read("get_identity", [p, h]);
  const verified = identity?.status === "VERIFIED";
  const score = verified && identity?.address ? await read("get_score", [identity.address]) : null;
  const tier = score?.tier ?? "Unverified";
  const accent = verified ? tierColor(tier) : "#7b7b7b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top: brand + seal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="56" height="56" viewBox="0 0 16 16">
              <path
                d="M8 0 L15 4 V12 L8 16 L1 12 V4 Z"
                fill="none"
                stroke="#d4af6a"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M5 8 L7 10 L11 5.5"
                fill="none"
                stroke="#f0d491"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: "#f0d491", fontSize: 34, fontWeight: 700, letterSpacing: 6 }}>
              CREDENCE
            </span>
          </div>
          <span
            style={{
              color: verified ? "#7fd1a0" : "#9a9a9a",
              border: `2px solid ${verified ? "#7fd1a0" : "#5a5a5a"}`,
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {verified ? "VERIFIED" : "UNVERIFIED"}
          </span>
        </div>

        {/* middle: handle */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#7b7b7b", fontSize: 30, letterSpacing: 8, textTransform: "uppercase" }}>
            {p}
          </span>
          <span style={{ color: "#f3efe6", fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>{h}</span>
        </div>

        {/* bottom: score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ color: accent, fontSize: 72, fontWeight: 800 }}>
              {verified ? score?.score ?? 0 : "—"}
            </span>
            <span style={{ color: "#7b7b7b", fontSize: 30 }}>/ 100</span>
            <span style={{ color: accent, fontSize: 38, fontWeight: 700, marginLeft: 12 }}>{tier}</span>
          </div>
          <span style={{ color: "#7b7b7b", fontSize: 26 }}>Sealed on GenLayer</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
