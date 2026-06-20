# Credence — On-chain Identity Verification on GenLayer

> Prove you control a social account and link it to your wallet — verified by a GenLayer
> Intelligent Contract, not a centralized database.

**Status:** ✅ **Phase 1 + 2 working.** The contract is live on Studionet and verified a real GitHub
gist as `VERIFIED` (score 98, HIGH confidence) via a 3-model AI validator panel reaching consensus.
The Next.js frontend (`web/`) reads the live registry and submits challenges/proofs from the
browser. Next: Phase 3 hardening + Phase 4 deploy to Vercel.

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
| Contract address | `0xc4044aafD0Df8121cAf352F4719C808a818FC70d` |
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
The website lives in `web/` (Next.js + GenLayerJS):
```bash
cd web
npm install
cp .env.example .env.local   # contract address is prefilled for Studionet
npm run dev                  # http://localhost:3000
```
The contract source is `contracts/credence.py` (deploy/interact via GenLayer Studio).

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
docs/        PRD.md TRD.md SDLC.md SCHEMAS.md AGENT_BUILD_PROMPT.md
contracts/   credence.py            (the deployed Intelligent Contract)
web/         Next.js + GenLayerJS frontend (landing / verify / registry)
```
