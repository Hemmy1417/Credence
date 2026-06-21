# Credence — On-chain Identity Verification on GenLayer

> Prove you control a social account and link it to your wallet — verified by a GenLayer
> Intelligent Contract, not a centralized database.

**Status:** ✅ **Deployed and live (Phase 4 complete).** The v2 Intelligent Contract runs on
Studionet and has verified real GitHub **and** X identities as `VERIFIED` (HIGH confidence) via an
AI validator panel reaching consensus. The Next.js frontend is live on Vercel — connect a wallet,
request a code, submit a proof, and browse the public registry, profiles and on-chain Credence
Scores entirely from the browser. Remaining: Phase 5 demo polish (video + screenshots).

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
**https://credencev2.vercel.app** — live on Vercel, reading the v2 contract on Studionet.

## Contract details
| Field | Value |
|---|---|
| Network | **Studionet** (deployed) |
| RPC | `https://studio.genlayer.com/api` |
| Chain ID | `61999` |
| Contract address | `0x84752FC7f00330C3AaB94F0C2aA7A5Fc52143D04` (v2) |
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
The deployed contract source is `contracts/credence_v2.py` (deploy/interact via GenLayer Studio).

## Testing
```bash
cd web
npm test                       # fast, deterministic unit tests (score logic, config invariants)
RUN_CONTRACT_SMOKE=1 npm test  # also runs read-only smoke tests against the live Studionet contract
```
Unit tests cover the Credence Score matrix (input validation, weighting, dedup, tier boundaries) and
the verify-method config invariants. The opt-in smoke test verifies `get_stats` / `get_score` /
`resolve_handle` against the deployed contract without flaking the default run.

## Demo evidence (verify it yourself)
A real, already-verified identity reviewers can inspect right now:

| Field | Value |
|---|---|
| Profile | https://credencev2.vercel.app/u/github/hemmy1417 |
| Platform / handle | `github` / `hemmy1417` |
| Evidence (public gist) | https://gist.github.com/Hemmy1417/5e288d4697e426c6788551c29dea88d7 |
| Public lookup API | `GET /api/verified/0x10DbF82A8bb191bd1c082de5Ef915E998Aa5CCD7` |

To run the full flow yourself: open the live app → **Verify** → create an Instant Wallet (gas is
sponsored on Studionet) → choose **GitHub** → **Get code** → paste that code into a new **public**
gist → submit the gist URL. The AI panel reaches a verdict and, on `VERIFIED`, seals the
handle↔address link on-chain.

## Demo script (90 seconds)
1. **Problem** — on-chain wallets are anonymous; there's no trustless way to know who's behind one.
2. Open the live app, go to **Verify**, create an **Instant Wallet** (note: gas sponsored).
3. Pick **GitHub**, enter a username, click **Get code** — show the unique, wallet-bound code.
4. Paste the code into a **public gist**, copy its URL.
5. Click **Submit proof** — show the pending state, then the **VERIFIED** verdict card with the
   on-chain transaction hash.
6. Open **View public profile** — show the **Credence Score** (read on-chain), the shareable badge,
   and the embeddable Markdown.
7. Open the **Registry** — the new identity appears in the public ledger; resolve handle → address.
8. Mention the **binding rule** (one handle, one wallet) and owner controls (**transfer / revoke**).
9. Close on **known limitations** + roadmap below.

## Screenshots
_Add images to `docs/screenshots/` and reference them here, e.g.:_
- `![Verify flow](docs/screenshots/verify.png)` — requesting a code + submitting a gist.
- `![Verdict](docs/screenshots/verdict.png)` — the VERIFIED card with the on-chain tx hash.
- `![Profile](docs/screenshots/profile.png)` — public profile with the Credence Score + badge.
- `![Registry](docs/screenshots/registry.png)` — the public verified registry.

## Known limitations
- **Reliable vs experimental platforms.** GitHub, a domain, and any public URL are anonymously
  fetchable and verify reliably. **X and Discord serve bots a login wall / JS shell**, so their
  proofs often can't be read and return `NEEDS_MORE_EVIDENCE` — they're labelled *experimental* in
  the UI (X *can* succeed, just not dependably).
- **Time-of-check.** Verification reflects the moment of submission; a post deleted afterwards
  doesn't auto-revoke. The owner can `transfer` or `revoke` the link on-chain at any time.
- **AI/web variance.** Judgement depends on source availability and LLM behaviour; unclear cases
  return `NEEDS_MORE_EVIDENCE` rather than passing.

## Roadmap
- **Done:** multi-platform verification, one-handle↔one-wallet binding, owner transfer + revoke,
  canonical on-chain Credence Score, public lookup API + embeddable badge + social cards.
- **Next:** disputes/appeals, freshness + re-verify, optional Supabase registry cache + search.
- **Later:** a drop-in "gate by Credence Score" widget/SDK for other dApps; Testnet Bradbury.

## Repo layout
```
docs/        PRD.md TRD.md SDLC.md SCHEMAS.md AGENT_BUILD_PROMPT.md
contracts/   credence_v2.py         (the deployed Intelligent Contract; credence.py is v1)
web/         Next.js + GenLayerJS frontend (landing / verify / registry / profile / developers)
```
