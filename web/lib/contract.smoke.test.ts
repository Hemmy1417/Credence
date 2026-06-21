import { describe, it, expect } from "vitest";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Read-only smoke test against the LIVE deployed contract. Network-dependent, so
// it's opt-in: run with `RUN_CONTRACT_SMOKE=1 npm test`. Keeps the default suite
// fast + deterministic while still letting CI/you exercise the real chain on demand.
const RUN = !!process.env.RUN_CONTRACT_SMOKE;
const ADDR = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x84752FC7f00330C3AaB94F0C2aA7A5Fc52143D04") as `0x${string}`;

function client() {
  return createClient({ chain: studionet, account: createAccount(generatePrivateKey()) });
}
async function read(fn: string, args: unknown[]) {
  const raw = await client().readContract({ address: ADDR, functionName: fn, args });
  return typeof raw === "string" ? raw : "";
}

describe.skipIf(!RUN)("live contract reads (Studionet)", () => {
  it("get_stats returns well-formed counters", async () => {
    const stats = JSON.parse(await read("get_stats", []));
    expect(typeof stats.total_verified).toBe("number");
    expect(typeof stats.total_challenges).toBe("number");
  }, 30000);

  it("get_score returns a 0-100 score and a tier", async () => {
    const s = JSON.parse(
      await read("get_score", ["0x10DbF82A8bb191bd1c082de5Ef915E998Aa5CCD7"]),
    );
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(["Unverified", "Emerging", "Trusted", "Highly Trusted"]).toContain(s.tier);
  }, 30000);

  it("resolve_handle returns either '' or a 0x address", async () => {
    const r = await read("resolve_handle", ["github", "hemmy1417"]);
    expect(r === "" || /^0x[0-9a-fA-F]{40}$/.test(r)).toBe(true);
  }, 30000);
});
