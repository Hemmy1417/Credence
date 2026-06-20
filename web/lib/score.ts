// Credence Score — derived entirely from data the deployed contract already stores
// (get_identities_by_address). No contract change needed. Pure + isomorphic
// (no client/server-only imports) so it works in pages, components, and API routes.

export type ScorableIdentity = { platform: string; status: string; confidence: string };
export type ScoreResult = { score: number; tier: string; color: string };

// Each distinct platform contributes once (rewards diversity, not repetition),
// weighted by the AI validators' confidence in that verification.
const PLATFORM_WEIGHT: Record<string, number> = {
  github: 40,
  domain: 40,
  url: 30,
  x: 30,
  discord: 20,
};
const CONFIDENCE_WEIGHT: Record<string, number> = { HIGH: 1, MEDIUM: 0.7, LOW: 0.4 };

export function computeScore(identities: ScorableIdentity[]): ScoreResult {
  const bestByPlatform = new Map<string, number>();
  for (const i of identities) {
    if (i.status !== "VERIFIED") continue;
    const pw = PLATFORM_WEIGHT[i.platform] ?? 25;
    const cw = CONFIDENCE_WEIGHT[(i.confidence || "LOW").toUpperCase()] ?? 0.4;
    bestByPlatform.set(i.platform, Math.max(bestByPlatform.get(i.platform) ?? 0, pw * cw));
  }
  let raw = 0;
  for (const v of bestByPlatform.values()) raw += v;
  const score = Math.min(100, Math.round(raw));
  return { score, ...tierFor(score) };
}

function tierFor(score: number): Omit<ScoreResult, "score"> {
  if (score <= 0) return { tier: "Unverified", color: "#7b7b7b" };
  if (score < 35) return { tier: "Emerging", color: "#e6b450" };
  if (score < 70) return { tier: "Trusted", color: "#d4af6a" };
  return { tier: "Highly Trusted", color: "#7fd1a0" };
}
