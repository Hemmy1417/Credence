import { describe, it, expect } from "vitest";
import { computeScore, tierColor, type ScorableIdentity } from "./score";

const id = (
  platform: string,
  confidence = "HIGH",
  status = "VERIFIED",
): ScorableIdentity => ({ platform, confidence, status });

// Mirrors the guide's §13 test matrix: input validation, happy path, dedup,
// boundary/regression. Pure + deterministic — no network.
describe("computeScore", () => {
  // ---- input validation ----
  it("returns Unverified/0 for no identities", () => {
    expect(computeScore([])).toEqual({ score: 0, tier: "Unverified", color: "#7b7b7b" });
  });

  it("ignores non-VERIFIED identities", () => {
    const r = computeScore([id("github", "HIGH", "PENDING"), id("x", "HIGH", "REVOKED")]);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("Unverified");
  });

  it("falls back to a default weight for an unknown platform", () => {
    expect(computeScore([id("mastodon", "HIGH")]).score).toBe(25);
  });

  it("treats an unknown/missing confidence as LOW (0.4)", () => {
    expect(computeScore([id("github", "BOGUS")]).score).toBe(16); // 40 * 0.4
  });

  // ---- happy path ----
  it("scores a single GitHub HIGH at 40 (Trusted)", () => {
    expect(computeScore([id("github", "HIGH")])).toMatchObject({ score: 40, tier: "Trusted" });
  });

  it("matches the real demo identity: github + x HIGH = 70 (Highly Trusted)", () => {
    const r = computeScore([id("github", "HIGH"), id("x", "HIGH")]);
    expect(r.score).toBe(70);
    expect(r.tier).toBe("Highly Trusted");
  });

  it("weights by confidence (github MEDIUM = 28)", () => {
    expect(computeScore([id("github", "MEDIUM")]).score).toBe(28); // 40 * 0.7
  });

  // ---- dedup / diversity ----
  it("counts each platform once, keeping its best confidence", () => {
    const r = computeScore([id("github", "LOW"), id("github", "HIGH")]);
    expect(r.score).toBe(40); // best of (16, 40), not the sum
  });

  it("rewards platform diversity and caps at 100", () => {
    const r = computeScore([id("github", "HIGH"), id("domain", "HIGH"), id("x", "HIGH")]);
    expect(r.score).toBe(100); // 40 + 40 + 30 = 110 -> capped
  });

  // ---- tier boundaries (regression) ----
  it("places tier boundaries at 35 and 70", () => {
    expect(computeScore([id("discord", "HIGH")]).tier).toBe("Emerging"); // 20
    expect(computeScore([id("x", "HIGH")]).tier).toBe("Emerging"); // 30 (<35)
    expect(computeScore([id("github", "HIGH")]).tier).toBe("Trusted"); // 40
    expect(computeScore([id("github", "HIGH"), id("x", "HIGH")]).tier).toBe("Highly Trusted"); // 70
  });
});

describe("tierColor", () => {
  it("maps known tiers and defaults unknown to grey", () => {
    expect(tierColor("Highly Trusted")).toBe("#7fd1a0");
    expect(tierColor("Trusted")).toBe("#d4af6a");
    expect(tierColor("Emerging")).toBe("#e6b450");
    expect(tierColor("Unverified")).toBe("#7b7b7b");
    expect(tierColor("whatever")).toBe("#7b7b7b");
  });
});
