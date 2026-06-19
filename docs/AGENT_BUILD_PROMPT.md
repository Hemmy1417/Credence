# Credence — Agent Build Prompt

> Paste this into Claude Code / Codex **with `PRD.md`, `TRD.md`, `SDLC.md`, `SCHEMAS.md`,
> and `contracts/credence_planning_skeleton.py` attached as context.** This is the single
> instruction that drives the phased build.

---

You are my GenLayer coding agent. We are building **Credence**, an on-chain identity
verification dApp on GenLayer.

**Source of truth:** the attached `PRD.md`, `TRD.md`, `SDLC.md`, `SCHEMAS.md`, and the
`credence_planning_skeleton.py` planning skeleton. Treat them as the spec. If something is
ambiguous or the official GenLayer SDK differs from the skeleton, **ask before deviating** —
do not silently change the stack or scope.

### What Credence does
A user proves they control a social account and links it to their wallet:
`request_challenge(platform, handle)` → user posts the returned code publicly →
`submit_proof(platform, handle, evidence_uri)` → the **Intelligent Contract** fetches the
post via GenVM web access, judges authorship + exact-code presence with an LLM, and **only on
VERIFIED** writes a canonical identity link on-chain. Anyone can then resolve handle↔address.

### Non-negotiable GenLayer rules
- The **Intelligent Contract is the source of truth** for verdicts and identity links. Never fake or override a verdict in the frontend/backend.
- AI judgement returns **JSON only**, matching the schemas in `SCHEMAS.md`.
- Wrap the web-fetch + LLM in a **non-deterministic block with an equivalence principle**; **extract stable fields first, then judge only those fields**, and compare on derived booleans/enums (`verdict`, `handle_match`, `code_found`) so validators converge.
- Keep contract methods **simple and typed**; add all read methods the frontend needs.
- **Verify the current GenLayer SDK syntax** (imports, decorators, `TreeMap`, web/LLM/equivalence APIs, RPC + chain IDs) against the official docs before finalising contract code — the skeleton is illustrative, not authoritative.
- Validate inputs: normalize handles (trim, lowercase, strip leading `@`), reject empties/duplicates/over-length/malformed URLs, allow-list platforms (`github`, `url` for MVP).
- On uncertainty or failed fetch ⇒ `NEEDS_MORE_EVIDENCE`; never auto-link.

### Frontend rules
- Next.js (App Router) + React + Tailwind + GenLayerJS.
- One clean GenLayer client file `/lib/genlayer.ts`; config from **environment variables only** (`/lib/config.ts`): RPC URL, chain ID, contract address, explorer URL. No hardcoded secrets, no private keys in the frontend.
- Every write transaction shows `pending → success | error`, a receipt/explorer link, and a retry button. **After a successful write, re-run the relevant reads and refresh the UI.**
- Verdict card shows verdict, score, confidence, reasons, risk_flags, timestamp, evidence link.
- Provide a clearly-labelled **demo mode** (sample handle + known-good public gist URL). Never render fake data as if it came from the contract.
- Maintain `.env.example` and the README as you go.

### Build order — follow `SDLC.md`, one phase at a time, do not skip
1. **Phase 1 — Contract MVP:** state maps + counters, `request_challenge`, `submit_proof` (with the non-deterministic judgement block + identity linking on VERIFIED), `revoke_identity`, and all views (`get_challenge`, `get_identity`, `resolve_handle`, `is_verified`, `get_identities_by_address`, `get_stats`, `get_latest`). Confirm it loads and runs in GenLayer Studio.
2. **Phase 2 — Frontend MVP:** `/verify` flow (connect → request → post instructions → submit → verdict), `/registry` + resolver, `/identity/[platform]/[handle]`. Wire to the deployed contract via env.
3. **Phase 3 — Testing & hardening:** run the test matrix in `SDLC.md` (valid / wrong-handle / missing-code / deleted-post / malformed input / wrong-RPC). Ensure no path can link an unverified identity.
4. **Phase 4 — Deployment:** deploy to Studionet (then optionally Testnet Bradbury); fill `.env.example` + README with network/RPC/chainId/address/explorer; verify `npm install/dev/build`; push to GitHub; deploy to Vercel with env vars.
5. **Phase 5 — Demo polish:** finish README (summary, live link, contract details, how-it-works, run-locally, demo evidence, known limitations, roadmap); add screenshots/video notes.

### After each phase
- Explain what changed and which files you touched.
- Run build/test/lint where possible and **fix errors before advancing**.
- Produce commit-ready code and a suggested commit message.
- **Stop and wait for my confirmation before starting the next phase.**

Start with **Phase 1**. First, restate your understanding of the contract interface and the
non-deterministic judgement approach in a few bullets, confirm the current GenLayer SDK
syntax you'll use (and where you verified it), then write the contract. Do not jump ahead to
the frontend.
