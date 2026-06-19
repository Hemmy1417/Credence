# Credence — Product Requirements Document (PRD)

**Project:** Credence — On-chain Identity Verification on GenLayer
**Version:** 1.0 (MVP / hackathon edition)
**Built with the GenLayer Vibe Coding Guide methodology (PAPITO v1.0)**

---

## 1. One-paragraph summary

Credence lets a user prove they control a social media account and link that account
to their on-chain wallet address. The user requests a unique challenge code, posts that
code publicly from their social profile, then submits the post URL. A GenLayer
**Intelligent Contract** fetches the live post, judges whether it genuinely came from the
claimed handle and contains the exact challenge code, and — only if verified — writes a
canonical **identity link** (handle ↔ address) on-chain. Anyone can then resolve a handle
to an address (or vice-versa) and trust that the link was adjudicated, not self-asserted.

## 2. Problem

On-chain accounts are anonymous strings of hex. There is no native, trustworthy way to
know that `0xabc…` is the same person as `@alice` on a social platform. Today people rely
on off-chain databases, centralized "verified" badges, or simple self-claims that anyone
can fake. There is no neutral, publicly auditable trust layer that links a wallet to a
real, controlled social identity.

## 3. Solution & why GenLayer is the right fit

Credence is **not** a deterministic problem — and that is exactly why GenLayer is needed:

| GenLayer strength | How Credence uses it |
|---|---|
| **Web-aware decisions** | The contract must fetch a *live* social post / profile to verify it. |
| **AI judgement** | It must decide whether the post genuinely belongs to the handle and contains the code — handling deleted posts, look-alike handles, formatting noise, and spoof attempts. |
| **Affects trust / public state** | The verified link is a trust primitive other dApps and users rely on. It belongs on-chain as canonical truth, not in a private DB. |
| **Natural-language / evidence review** | Evidence is an unstructured public URL whose contents must be interpreted, not just stored. |

A normal smart contract **cannot** fetch a tweet or judge whether it's authentic. A normal
backend **could** fetch it, but then the trust depends on trusting that backend — defeating
the point. GenLayer's AI-validator consensus is what makes the verification itself
trustless.

> **Rule we follow (from the guide):** the Intelligent Contract holds the canonical identity
> link and verdict. Any backend may only cache/index for UX — it must never be the source of
> truth for whether an identity is verified.

## 4. Target users

- **Builders / dApp users** who want a verifiable, portable on-chain reputation tied to a real social identity.
- **Communities & DAOs** that want sybil-resistance ("one verified human social account per role").
- **Other dApps** that want to look up "is this address linked to a verified `@handle`?"

## 5. MVP scope (what we build first)

**Platform for MVP:** **GitHub** (gist or profile-README) **+ a generic "public URL" mode**.

> **Why GitHub first (important design decision):** GenVM web access needs a *reliably
> fetchable* public source. GitHub gists/profiles and most public pages return open HTML/JSON
> without login walls. X/Twitter, Instagram, etc. increasingly block unauthenticated fetches,
> which makes them fragile for an on-chain web fetch. So the MVP proves the full mechanism on
> a source that fetches cleanly, and **X/Twitter + others are a clearly-labelled Phase-2
> stretch** with the fetch caveat documented. The verdict schema and flow are platform-agnostic,
> so adding platforms later is additive, not a rewrite.

**In scope (MVP):**
1. Request a verification challenge for `(platform, handle)` → unique code bound to the caller's address.
2. Post the code publicly, then submit the proof URL.
3. GenLayer fetches + judges + (on success) writes the canonical identity link.
4. Read/resolve: handle → address, address → handles, is-verified checks, global stats, latest verifications.
5. Frontend: connect wallet → request challenge → submit proof → see live pending/verdict states → public registry view.

**Out of scope (MVP):**
- Multiple competing claims arbitration / disputes (Phase 3+).
- Off-chain backend, file uploads, auth (add only if UX demands it — Phase 3 optional).
- Revocation appeals workflow beyond a simple owner-initiated unlink.
- Paid/staked verification, tokens, NFTs.

## 6. Core user flow (happy path)

1. User connects wallet.
2. User enters platform + handle → calls `request_challenge` → receives code e.g. `credence-7f3a2b9c`.
3. App shows copy-paste instructions: "Post exactly this on your GitHub gist/profile."
4. User posts it, copies the public URL.
5. User pastes URL → calls `submit_proof`.
6. UI shows **PENDING** while GenLayer fetches + judges.
7. Contract returns a **verdict JSON**; on `VERIFIED` it stores the identity link.
8. UI shows a **verdict card** (verdict, confidence, reasons) and a ✅ verified badge.
9. Public **Registry** page lists verified identities; anyone can resolve a handle/address.

## 7. Success criteria (demoable in <30s)

- A fresh user can go from "connect wallet" to a **green VERIFIED identity link stored
  on-chain** in one sitting.
- A **fake/mismatched** proof returns `REJECTED` and is **not** linked.
- An **ambiguous/deleted** proof returns `NEEDS_MORE_EVIDENCE` and is **not** linked.
- Anyone can independently `resolve_handle("github","alice")` → the linked address.

## 8. Key product decisions

- **Challenge binds to address.** The code is derived from / stored against the caller's
  wallet address, so posting it proves the wallet-holder also controls the social account
  **at that moment**.
- **Exact-code matching** keeps validator outputs stable (low LLM variance) — the AI judges
  authorship + presence of an *exact* string, not subjective "quality".
- **Evidence hash + timestamp stored**, so a later-deleted post still has an audit trail and
  the link can be revoked/re-verified.
- **Honest limitations surfaced in UI & README** (web source availability, time-of-check).

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Social platform blocks unauthenticated fetch (esp. X) | MVP targets reliably-fetchable sources (GitHub/public URL); X labelled Phase-2 with caveat. |
| LLM/validator disagreement | Exact-string match + stable extracted fields + JSON-only output + equivalence on derived booleans. |
| Post deleted after verification (time-of-check vs time-of-use) | Store evidence hash + timestamp; support owner revoke + re-verify. |
| Handle impersonation / look-alikes | Code is bound to the wallet; verdict requires exact handle match; risk_flags surface look-alikes. |
| Web source unavailable at judge time | Verdict returns `NEEDS_MORE_EVIDENCE`; UI shows retry; never auto-link on failure. |
| Leaking secrets / private keys | `.env` + `.env.example`; never commit keys; RPC/address/chainId from env only. |

## 10. Future roadmap (post-MVP)

- Phase 2: add X/Twitter (via reliably-fetchable mirror/API), GitHub-README mode, multi-handle profiles.
- Phase 3: dispute/appeal flow, revocation reasons, optional Supabase cache for fast registry + search.
- Phase 4: "Credence score" aggregating number/quality of verified links; consumer SDK for other dApps to query.
