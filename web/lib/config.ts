// Credence frontend config. The contract address comes from the environment;
// the network (Studionet, chain 61999) is provided by genlayer-js's `studionet` chain.
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "";

// True only when a real 0x… address (20 bytes / 40 hex chars) is configured.
// Used to show a clear setup notice instead of silently rendering empty data
// when NEXT_PUBLIC_CONTRACT_ADDRESS is missing (e.g. forgotten on Vercel).
export const CONTRACT_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

// Explorer link for a transaction hash. Returns "" unless NEXT_PUBLIC_EXPLORER_URL
// is configured, so we never ship a broken link — the tx hash itself is always
// shown as the verifiable artifact regardless.
export function explorerTxUrl(hash: string): string {
  if (!EXPLORER_URL || !hash) return "";
  return `${EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
}

// First-class platforms the v2 contract accepts.
export const PLATFORMS = ["github", "x", "domain", "discord", "url"] as const;
export type Platform = (typeof PLATFORMS)[number];

// User-facing verification methods. Each maps to a first-class contract platform.
export type Method = {
  id: string;
  label: string;
  platform: Platform;
  handlePlaceholder: string;
  evidencePlaceholder: string;
  hint: string;
  cta?: string;
  ctaUrl?: string;
};

export const METHODS: Method[] = [
  {
    id: "github",
    label: "GitHub",
    platform: "github",
    handlePlaceholder: "your GitHub username",
    evidencePlaceholder: "https://gist.github.com/you/…",
    hint: "Post the exact code in a public GitHub gist, then paste the gist URL.",
    cta: "Open gist.github.com →",
    ctaUrl: "https://gist.github.com",
  },
  {
    id: "x",
    label: "X / Twitter",
    platform: "x",
    handlePlaceholder: "your @handle",
    evidencePlaceholder: "https://x.com/you/status/…",
    hint: "Post the exact code in a public tweet, then paste the tweet URL.",
  },
  {
    id: "domain",
    label: "Website / Domain",
    platform: "domain",
    handlePlaceholder: "yourdomain.com",
    evidencePlaceholder: "https://yourdomain.com/.well-known/credence.txt",
    hint: "Host the code at https://yourdomain.com/.well-known/credence.txt, then paste that URL.",
  },
  {
    id: "discord",
    label: "Discord",
    platform: "discord",
    handlePlaceholder: "your Discord username",
    evidencePlaceholder: "https://… link to a public message/profile",
    hint: "Put the exact code on a public Discord message or profile, then paste its link.",
  },
  {
    id: "url",
    label: "Other public URL",
    platform: "url",
    handlePlaceholder: "an identifier (e.g. your name)",
    evidencePlaceholder: "https://… a public page you control",
    hint: "Put the exact code on any public page you control, then paste its URL.",
  },
];
