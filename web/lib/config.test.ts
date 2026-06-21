import { describe, it, expect, afterEach, vi } from "vitest";
import { METHODS, PLATFORMS, explorerTxUrl } from "./config";

describe("METHODS config (invariants the verify flow relies on)", () => {
  it("has unique ids", () => {
    const ids = METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only maps to first-class contract platforms", () => {
    for (const m of METHODS) expect(PLATFORMS).toContain(m.platform);
  });

  it("lists reliable methods before experimental ones", () => {
    const firstExperimental = METHODS.findIndex((m) => m.experimental);
    const lastReliable = METHODS.map((m) => !!m.experimental).lastIndexOf(false);
    expect(firstExperimental).toBeGreaterThan(lastReliable);
  });

  it("starts with GitHub (the recommended reliable path)", () => {
    expect(METHODS[0].id).toBe("github");
  });

  it("flags exactly X and Discord as experimental, each with a note", () => {
    const experimental = METHODS.filter((m) => m.experimental);
    expect(experimental.map((m) => m.id).sort()).toEqual(["discord", "x"]);
    for (const m of experimental) expect(m.note && m.note.length).toBeGreaterThan(0);
  });

  it("gives every method a handle + evidence placeholder and a hint", () => {
    for (const m of METHODS) {
      expect(m.handlePlaceholder).toBeTruthy();
      expect(m.evidencePlaceholder).toBeTruthy();
      expect(m.hint).toBeTruthy();
    }
  });
});

describe("explorerTxUrl", () => {
  const hash = "0xabc123";

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns '' when no explorer is configured (no broken link shipped)", () => {
    expect(explorerTxUrl(hash)).toBe("");
  });

  it("returns '' for an empty hash even when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_EXPLORER_URL", "https://explorer.example");
    const { explorerTxUrl: fn } = await import("./config");
    expect(fn("")).toBe("");
  });

  it("builds <base>/tx/<hash> and strips a trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_EXPLORER_URL", "https://explorer.example/");
    const { explorerTxUrl: fn } = await import("./config");
    expect(fn(hash)).toBe("https://explorer.example/tx/0xabc123");
  });
});
