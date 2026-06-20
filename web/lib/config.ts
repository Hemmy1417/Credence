// Credence frontend config. The contract address comes from the environment;
// the network (Studionet, chain 61999) is provided by genlayer-js's `studionet` chain.
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "";

export const PLATFORMS = ["github", "url"] as const;
export type Platform = (typeof PLATFORMS)[number];
