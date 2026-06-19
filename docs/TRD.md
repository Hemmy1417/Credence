# Credence — Technical Requirements Document (TRD)

**Project:** Credence — On-chain Identity Verification on GenLayer
**Companion to:** `PRD.md`, `SDLC.md`, `SCHEMAS.md`

---

## 1. Architecture (4-layer GenLayer mental model)

| Layer | Responsibility | Tools |
|---|---|---|
| **Frontend** | Wallet connect, challenge request form, proof submission, pending/verdict states, public registry & resolver views. | Next.js (App Router), React, TailwindCSS, GenLayerJS, Vercel |
| **Intelligent Contract (source of truth)** | Generate challenges, fetch + judge proofs via AI, store canonical identity links + verdicts, expose read methods. | Python Intelligent Contract, GenVM, GenLayer Studio/CLI |
| **Optional backend/database** | **None for MVP.** (Phase 3 optional: Supabase cache for registry search/leaderboard only — never the truth layer.) | Supabase (later, optional) |
| **Agent workflow/docs** | PRD, TRD, SDLC, schemas, build prompt, README, tests, submission checklist. | Claude Code / Codex + this repo |

**Hard rule:** the contract decides verification. The frontend/backend may cache or display
results but must never fabricate or override a verdict.

## 2. Networks

| Setting | Studionet (prototyping) | Testnet Bradbury (final testing) |
|---|---|---|
| RPC | `https://studio.genlayer.com/api` | `https://rpc-bradbury.genlayer.com` |
| Chain ID | `61999` | `4221` |
| Contract address | `NEXT_PUBLIC_CONTRACT_ADDRESS` (env) | `NEXT_PUBLIC_CONTRACT_ADDRESS` (env) |

> Values from the guide as of its publication. **The agent must re-confirm RPC/chainId and
> exact SDK syntax from the official GenLayer docs before final deploy** — networks and SDK
> decorators can change.

Deployment progression: **Studio → Studionet → frontend against deployed address →
Testnet Bradbury** for stronger final testing.

## 3. Contract interface (canonical)

> **GenVM gotcha — runner comment.** The contract's **first line must be the runner
> comment** `# { "Depends": "py-genlayer:test" }`. Without it GenVM rejects the file at
> schema time with `invalid_contract absent_runner_comment`. It must be line 1, before any
> other comment or import.

### State
- `owner: str`
- `total_challenges: u256`
- `total_verified: u256`
- `challenges: TreeMap[str, str]` — key `"{address}:{platform}:{handle}"` → challenge JSON
- `identities: TreeMap[str, str]` — key `"{platform}:{handle}"` → identity JSON (the canonical link)
- `address_index: TreeMap[str, str]` — key `address` → JSON array of `"platform:handle"` keys

> Keys are lowercased/normalized (trim, lowercase handle, strip leading `@`) before use to
> avoid duplicate/spoof variants.

### Write methods
| Method | Inputs | Behaviour |
|---|---|---|
| `request_challenge(platform, handle)` | strings | Validate inputs; derive a unique, address-bound code (e.g. `credence-` + short hash of `sender+platform+handle+nonce`); store challenge as `PENDING`; return challenge JSON. Re-requesting refreshes the code. |
| `submit_proof(platform, handle, evidence_uri)` | strings | Validate inputs + that a matching PENDING challenge exists for sender. Run **non-deterministic** web-fetch + LLM judgement (see §4). Store verdict. **On `VERIFIED`**: write `identities[platform:handle]`, append to `address_index[sender]`, increment `total_verified`. Return verdict JSON. |
| `revoke_identity(platform, handle)` | strings | Only the address that owns the link may unlink; remove from `identities` + `address_index`; mark `REVOKED`. |

### View (read) methods
| Method | Returns |
|---|---|
| `get_challenge(address, platform, handle)` | challenge JSON or `""` |
| `get_identity(platform, handle)` | identity JSON or `""` |
| `get_identities_by_address(address)` | JSON array of identity records |
| `resolve_handle(platform, handle)` | linked address string or `""` |
| `is_verified(address, platform, handle)` | bool |
| `get_stats()` | JSON: totals + per-platform counts |
| `get_latest(n)` | JSON array of the most recent n verifications |

## 4. AI judgement design (the non-deterministic core)

The verification runs inside a GenLayer non-deterministic block (web access + LLM), wrapped
with an **equivalence principle** so validators converge.

**Determinism discipline (from the guide):**
1. **Fetch** the evidence URL via GenVM web access.
2. **Extract stable fields first**, do not judge raw page text: `author_handle`, `code_present` (exact-substring boolean for the challenge code), `post_visibility`, `fetched_ok`.
3. **Judge only the extracted fields** with the LLM, returning **JSON only**.
4. **Compare on derived booleans/enums** (`handle_match`, `code_found`, `verdict`) — not free text — so the equivalence rule can match across validators.
5. If `fetched_ok` is false or fields are missing → `NEEDS_MORE_EVIDENCE`. Never auto-pass on uncertainty.

**Judgement prompt (template — see `SCHEMAS.md` for the exact schema):**
```
You are an impartial GenLayer validator verifying a social-identity claim.
Task: Decide whether the fetched social post/profile proves the claimant controls the account.
Claim:
- platform: [PLATFORM]
- expected handle: [HANDLE]
- required challenge code (must appear EXACTLY): [CODE]
Fetched evidence (extracted fields only):
- author_handle: [...]
- code_present: [true|false]
- post_visibility: [public|restricted|unknown]
- fetched_ok: [true|false]
Rules:
- Return valid JSON only, matching the schema. Do not invent facts.
- handle_match is true only if author_handle equals the expected handle (case-insensitive, ignore leading @).
- code_found is true only if the EXACT challenge code is present.
- verdict = VERIFIED only if handle_match AND code_found AND fetched_ok.
- If fetch failed or evidence is unclear → NEEDS_MORE_EVIDENCE.
- verdict ∈ {VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE}; score is integer 0–100.
```

## 5. Frontend technical requirements

- **Single client file:** `/lib/genlayer.ts` — SDK client creation, contract read/write helpers, receipt polling. No SDK calls scattered in components.
- **Config from env only:** `/lib/config.ts` reads `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_EXPLORER_URL`.
- **Read hooks:** `useStats`, `useIdentity`, `useIdentitiesByAddress`, `useLatest`.
- **Write actions:** `requestChallenge`, `submitProof`, `revokeIdentity` — each returns a tx handle the UI polls.
- **Transaction UI:** every write shows `idle → pending → success | error`, a receipt/explorer link, and a retry button.
- **Verdict UI:** verdict, score, confidence, reasons[], risk_flags[], timestamp, evidence link.
- **After any successful write, re-run the relevant reads** and refresh the view.
- **Demo mode:** pre-filled sample handle + a known-good public gist URL so reviewers can test instantly (clearly labelled as sample).
- **No hardcoded/faked verdicts** ever rendered as if from the contract.

## 6. Pages
- `/` — landing + "Verify your identity" CTA + how-it-works (3 steps).
- `/verify` — wallet connect → request challenge → post instructions → submit proof → verdict card.
- `/registry` — public table of verified identities + search/resolve box (handle↔address).
- `/identity/[platform]/[handle]` — single identity detail (status, evidence link, verified-at).

## 7. Environment variables (`.env.example`)
```
NEXT_PUBLIC_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_EXPLORER_URL=
# Never commit a real .env. No private keys in the frontend.
```

## 8. Testing approach
Unit/behaviour tests on the contract (input validation, happy path, fake proof, ambiguous
proof) + manual frontend transaction-state tests. See `SDLC.md` Phase 3 and the guide's
testing matrix.

## 9. Security notes
- Normalize + validate all string inputs; reject empty handle/URL, over-length summaries, malformed URLs, duplicate active challenges.
- Only the owning address may revoke its own link.
- Challenge code bound to sender address (no replaying another user's code).
- `.env` git-ignored; `.env.example` committed; no secrets/keys in repo.
- Backend (if ever added) is cache-only and cannot mint verdicts.
