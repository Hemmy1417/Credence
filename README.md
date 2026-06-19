# Credence — On-chain Identity Verification on GenLayer

> Prove you control a social account and link it to your wallet — verified by a GenLayer
> Intelligent Contract, not a centralized database.

**Status:** Phase 0 complete (planning). Build driven by `docs/AGENT_BUILD_PROMPT.md`.

## Project summary
On-chain accounts are anonymous. Credence lets a user request a unique challenge code, post
it publicly from their social profile, and submit the post URL. A GenLayer Intelligent
Contract fetches the live post, judges whether it genuinely came from the claimed handle and
contains the exact code, and — only if verified — writes a canonical **handle ↔ address**
link on-chain that anyone can resolve and trust.

**GenLayer advantage:** verification needs live web access + AI judgement and produces public
trust state — none of which a normal smart contract can do, and which a normal backend can't
do *trustlessly*.

## Live demo
_TODO (Phase 4): Vercel link._

## Contract details
| Field | Value |
|---|---|
| Network | **Studionet** (deployed) |
| RPC | `https://studio.genlayer.com/api` |
| Chain ID | `61999` |
| Contract address | `0xfe006b3BC58138D7437Ebb4904076803aCC4527c` |
| Explorer link | _TODO_ |

> First successful write (`request_challenge`) reached consensus and was ACCEPTED on Studionet.

## Tech stack
- **Intelligent Contract:** Python + GenVM (source of truth for verdicts + identity links)
- **Frontend:** Next.js (App Router), React, TailwindCSS, GenLayerJS, Vercel
- **Backend:** none (MVP). Optional Supabase cache later — never the truth layer.

## How it works
1. Connect wallet → `request_challenge(platform, handle)` → get a unique, address-bound code.
2. Post the exact code publicly (MVP: GitHub gist / public URL).
3. Submit the post URL → `submit_proof(...)`.
4. Contract fetches + judges (web + LLM) → returns a verdict JSON.
5. On `VERIFIED`, the handle↔address link is stored on-chain; browse it in the public registry.

## How to run locally
```bash
npm install
cp .env.example .env   # fill in RPC, chain ID, contract address, explorer
npm run dev
npm run build
```

## Demo evidence (sample to test quickly)
_TODO (Phase 2/5): a known-good public gist URL + handle reviewers can paste._

## Known limitations
- MVP verifies reliably-fetchable sources (GitHub / public URLs). X/Twitter and similar
  block unauthenticated fetches and are a Phase-2 stretch.
- Verification is time-of-check: a post deleted afterwards doesn't auto-revoke (audit hash +
  manual revoke/re-verify provided).
- AI/web judgement depends on source availability and LLM behaviour; unclear cases return
  `NEEDS_MORE_EVIDENCE` rather than passing.

## Roadmap
- Phase 2: X/Twitter + more platforms, multi-handle profiles.
- Phase 3: disputes/appeals, optional Supabase registry cache + search.
- Phase 4: aggregate "Credence score" + query SDK for other dApps.

## Repo layout
```
docs/    PRD.md TRD.md SDLC.md SCHEMAS.md AGENT_BUILD_PROMPT.md
contracts/  credence_planning_skeleton.py   (planning skeleton)
# contract/ and frontend/ get built in Phases 1–2
```
