# Credence — SDLC Phase Plan

**Build one phase at a time. Do not skip phases. Commit a working checkpoint after each.**
Each phase has an explicit **exit criterion** — do not advance until it is met.

---

## Phase 0 — Research & definition  ✅ (this package)
**Goal:** Idea validated for GenLayer; PRD/TRD/SDLC + schemas defined.
**Exit:** `PRD.md`, `TRD.md`, `SDLC.md`, `SCHEMAS.md` complete; GenLayer fit confirmed;
verdict + identity JSON schemas locked; MVP platform chosen (GitHub/public-URL first).

## Phase 1 — Contract MVP
**Goal:** The Intelligent Contract compiles/loads in GenLayer Studio, holds state, and the
core verify flow works end-to-end on-chain.
**Build:**
- State maps (`challenges`, `identities`, `address_index`) + counters.
- `request_challenge` (address-bound code, PENDING).
- `submit_proof` with the non-deterministic web-fetch + LLM judgement block returning verdict JSON; links identity on `VERIFIED`.
- Views: `get_challenge`, `get_identity`, `resolve_handle`, `is_verified`, `get_identities_by_address`, `get_stats`, `get_latest`.
- Input validation + safety (normalize handles, reject empties/dupes/malformed URLs).
**Exit:** In Studio, a request→submit cycle produces a stored verdict; a valid proof links an
identity, a bad proof does not; all view methods return sane values.

## Phase 2 — Frontend MVP
**Goal:** A user can drive the whole flow from the browser against the deployed contract.
**Build:**
- `/lib/genlayer.ts` client + `/lib/config.ts` (env-driven), `.env.example`.
- `/verify` flow: connect wallet → request challenge → copy code + instructions → submit proof URL → pending → verdict card.
- `/registry` + resolver, `/identity/[platform]/[handle]` detail.
- Pending/success/error states + receipt link + retry on every write; reads refresh after writes.
- Demo mode with a known-good sample gist URL.
**Exit:** From a fresh browser/wallet, a user reaches a stored VERIFIED link and sees it in the registry.

## Phase 3 — Testing & hardening
**Goal:** Bad inputs, edge cases and failure states handled gracefully.
**Build / verify (per the guide's test matrix):**
- Input validation: empty/duplicate/over-length/malformed-URL.
- Happy path: valid proof → VERIFIED + linked.
- Bad evidence: wrong handle or missing code → REJECTED, not linked.
- Ambiguous/unfetchable: deleted post / blocked source → NEEDS_MORE_EVIDENCE, not linked.
- Frontend: pending shows, receipt resolves, state refreshes; wrong RPC/address → helpful error.
- Regression: Phase-2 flow still works.
**Exit:** All matrix cases pass; no path can link an unverified identity.

## Phase 4 — Deployment
**Goal:** Contract deployed + frontend live.
**Build:**
- Deploy contract to Studionet (then optionally Testnet Bradbury).
- Put network/RPC/chainId/address/explorer into `.env.example` + README.
- `npm install`, `npm run dev`, `npm run build` clean; push to GitHub; deploy to Vercel; set env vars on host.
**Exit:** Live Vercel URL works against the deployed contract from a fresh wallet.

## Phase 5 — Demo / submission polish
**Goal:** Easy to judge in under 30 seconds.
**Build:**
- README: summary, live link, contract details (network/RPC/chainId/address/explorer), tech stack, how-it-works, run-locally, demo evidence, known limitations, roadmap.
- Demo video + screenshots; sample evidence documented.
**Exit:** All three final checklists in the guide pass; GenLayer value is obvious immediately.

---

### Checkpoint commits (suggested)
```
git commit -m "phase 0: PRD/TRD/SDLC/schemas"
git commit -m "phase 1: contract MVP (challenge + judge + links + views)"
git commit -m "phase 2: frontend MVP (verify flow + registry)"
git commit -m "phase 3: testing + hardening"
git commit -m "phase 4: deployed contract + live frontend"
git commit -m "phase 5: demo polish + README"
```
