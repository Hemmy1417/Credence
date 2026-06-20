"use client";

// Contract layer for the Credence frontend.
// READS use an internal read-only client (no user wallet needed).
// WRITES take the connected wallet's `client` (from useWallet) + address.
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS, type Platform } from "./config";

// ---- record shapes (mirror docs/SCHEMAS.md) ----
export type Challenge = {
  address: string;
  platform: string;
  handle: string;
  challenge_code: string;
  status: string;
  instructions: string;
  seq: number;
};

export type Identity = {
  address: string;
  platform: string;
  handle: string;
  status: string;
  evidence_uri: string;
  verified_seq: number;
  confidence: string;
  reasons: string[];
};

export type Stats = {
  total_challenges: number;
  total_verified: number;
  by_platform: Record<string, number>;
};

export type ProofResult = { verified: boolean; identity: Identity | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

// ---- read-only client (throwaway account, reads never need the user's wallet) ----
let _readClient: Client = null;
function readClient(): Client {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet, account: createAccount(generatePrivateKey()) });
  }
  return _readClient;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

async function read(functionName: string, args: unknown[] = []): Promise<string> {
  const raw = await readClient().readContract({ address: CONTRACT_ADDRESS, functionName, args });
  return asString(raw);
}

// ---- reads ----
export async function getStats(): Promise<Stats> {
  const raw = await read("get_stats");
  return raw ? JSON.parse(raw) : { total_challenges: 0, total_verified: 0, by_platform: {} };
}

export async function getLatest(n = 20): Promise<Identity[]> {
  const raw = await read("get_latest", [n]);
  return raw ? JSON.parse(raw) : [];
}

export async function getIdentity(platform: Platform, handle: string): Promise<Identity | null> {
  const raw = await read("get_identity", [platform, handle]);
  return raw ? (JSON.parse(raw) as Identity) : null;
}

export async function resolveHandle(platform: Platform, handle: string): Promise<string> {
  return read("resolve_handle", [platform, handle]);
}

export async function getChallenge(
  address: string,
  platform: Platform,
  handle: string,
): Promise<Challenge | null> {
  const raw = await read("get_challenge", [address, platform, handle]);
  return raw ? (JSON.parse(raw) as Challenge) : null;
}

export async function getIdentitiesByAddress(address: string): Promise<Identity[]> {
  const raw = await read("get_identities_by_address", [address]);
  return raw ? JSON.parse(raw) : [];
}

// ---- writes (bound to the connected wallet's client) ----
async function writeAndWait(client: Client, functionName: string, args: unknown[] = []) {
  const hash = await client.writeContract({ address: CONTRACT_ADDRESS, functionName, args });
  await client.waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 5000, retries: 60 });
  return hash;
}

async function readWith(client: Client, functionName: string, args: unknown[]): Promise<string> {
  try {
    const raw = await client.readContract({ address: CONTRACT_ADDRESS, functionName, args });
    return asString(raw);
  } catch {
    return "";
  }
}

export async function requestChallenge(
  client: Client,
  address: string,
  platform: Platform,
  handle: string,
): Promise<Challenge> {
  await writeAndWait(client, "request_challenge", [platform, handle]);
  // On-chain state can lag a beat behind finalization — read back through the same
  // client (most consistent) and retry briefly before giving up.
  for (let i = 0; i < 6; i++) {
    const raw = await readWith(client, "get_challenge", [address, platform, handle]);
    if (raw) return JSON.parse(raw) as Challenge;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Challenge was created — click "Get code" again to fetch it.');
}

export async function submitProof(
  client: Client,
  address: string,
  platform: Platform,
  handle: string,
  evidenceUri: string,
): Promise<ProofResult> {
  // Binding guard: a handle already verified by a DIFFERENT wallet can't be claimed.
  // The owner can still re-verify (refresh) their own, or release it via revoke first.
  const existing = await getIdentity(platform, handle);
  if (
    existing &&
    existing.status === "VERIFIED" &&
    existing.address.toLowerCase() !== address.toLowerCase()
  ) {
    throw new Error(
      `${platform}/${handle} is already bound to ${existing.address}. It can't be claimed from a different wallet. (The owner can transfer it by revoking from that wallet first.)`,
    );
  }
  await writeAndWait(client, "submit_proof", [platform, handle, evidenceUri]);
  const identity = await getIdentity(platform, handle);
  const verified =
    !!identity &&
    identity.status === "VERIFIED" &&
    identity.address.toLowerCase() === address.toLowerCase();
  return { verified, identity: verified ? identity : null };
}

// ---- v2: canonical on-chain Credence Score ----
export type OnchainScore = { address: string; score: number; tier: string; links: number };

export async function getScore(address: string): Promise<OnchainScore> {
  const raw = await read("get_score", [address]);
  return raw ? JSON.parse(raw) : { address, score: 0, tier: "Unverified", links: 0 };
}

// ---- v2: owner-only transfer of a verified handle to a new wallet ----
export async function transferIdentity(
  client: Client,
  platform: Platform,
  handle: string,
  newAddress: string,
): Promise<void> {
  await writeAndWait(client, "transfer_identity", [platform, handle, newAddress]);
}
