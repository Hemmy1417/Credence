// Credence frontend config. The contract address comes from the environment;
// the network (Studionet, chain 61999) is provided by genlayer-js's `studionet` chain.
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "";

// Platforms the deployed contract accepts (immutable). Everything else verifies
// through the generic "url" platform until a contract v2 adds first-class types.
export const PLATFORMS = ["github", "url"] as const;
export type Platform = (typeof PLATFORMS)[number];

// User-facing verification methods. Each maps to a contract platform; X/domain/etc.
// ride on "url" with tailored guidance — no redeploy required.
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
    platform: "url",
    handlePlaceholder: "your @handle",
    evidencePlaceholder: "https://x.com/you/status/…",
    hint: "Post the exact code in a public tweet, then paste the tweet URL.",
  },
  {
    id: "domain",
    label: "Website / Domain",
    platform: "url",
    handlePlaceholder: "yourdomain.com",
    evidencePlaceholder: "https://yourdomain.com/.well-known/credence.txt",
    hint: "Host the code at https://yourdomain.com/.well-known/credence.txt, then paste that URL.",
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
