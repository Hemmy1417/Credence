"use client";

// Thin wrapper around genlayer-js for the Credence contract.
// All contract reads/writes go through here so the UI never touches the SDK directly.
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

// ---- account: a stable, locally-stored GenLayer account per browser ----
const LS_KEY = "credence_pk";

function getPrivateKey(): `0x${string}` {
  let pk = localStorage.getItem(LS_KEY);
  if (!pk) {
    pk = generatePrivateKey();
    localStorage.setItem(LS_KEY, pk);
  }
  return pk as `0x${string}`;
}

// lazily-built singletons (browser only)
let _account: ReturnType<typeof createAccount> | null = null;
let _client: ReturnType<typeof createClient> | null = null;

function account() {
  if (!_account) _account = createAccount(getPrivateKey());
  return _account;
}

function client() {
  if (!_client) _client = createClient({ chain: studionet, account: account() });
  return _client;
}

export function myAddress(): string {
  return account().address;
}

// ---- low-level helpers ----
function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

async function read(functionName: string, args: unknown[] = []): Promise<string> {
  const raw = await client().readContract({ address: CONTRACT_ADDRESS, functionName, args });
  return asString(raw);
}

async function writeAndWait(functionName: string, args: unknown[] = []) {
  const hash = await client().writeContract({ address: CONTRACT_ADDRESS, functionName, args });
  await client().waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 5000, retries: 60 });
  return hash;
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

// ---- writes (each writes, waits for consensus, then reads fresh state) ----
export async function requestChallenge(platform: Platform, handle: string): Promise<Challenge> {
  await writeAndWait("request_challenge", [platform, handle]);
  const ch = await getChallenge(myAddress(), platform, handle);
  if (!ch) throw new Error("Challenge was created but could not be read back.");
  return ch;
}

export type ProofResult = { verified: boolean; identity: Identity | null };

export async function submitProof(
  platform: Platform,
  handle: string,
  evidenceUri: string,
): Promise<ProofResult> {
  await writeAndWait("submit_proof", [platform, handle, evidenceUri]);
  const identity = await getIdentity(platform, handle);
  const verified =
    !!identity &&
    identity.status === "VERIFIED" &&
    identity.address.toLowerCase() === myAddress().toLowerCase();
  return { verified, identity: verified ? identity : null };
}
