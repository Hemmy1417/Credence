# Credence — Data & Verdict Schemas

These are the **locked contracts** between the Intelligent Contract, the AI judgement, and
the frontend. The frontend must parse these — never free-form natural language.

---

## 1. Challenge JSON (returned by `request_challenge`, stored in `challenges`)
```json
{
  "address": "0x0000000000000000000000000000000000000000",
  "platform": "github",
  "handle": "alice",
  "challenge_code": "credence-7f3a2b9c",
  "status": "PENDING",
  "instructions": "Post the exact code 'credence-7f3a2b9c' in a public GitHub gist, then submit its URL.",
  "created_at": 1718800000
}
```
- `status` ∈ `PENDING | CONSUMED | EXPIRED`
- `challenge_code` is derived from the caller's address (+platform+handle+nonce) so it is unique and address-bound.

## 2. Verdict JSON (produced by the AI judgement in `submit_proof`)
```json
{
  "verdict": "VERIFIED | REJECTED | NEEDS_MORE_EVIDENCE",
  "handle_match": true,
  "code_found": true,
  "fetched_ok": true,
  "score": 0,
  "reasons": ["author handle matches", "exact challenge code present"],
  "risk_flags": [],
  "confidence": "LOW | MEDIUM | HIGH"
}
```
**Rules enforced in the prompt:**
- `verdict = VERIFIED` only if `handle_match && code_found && fetched_ok`.
- `fetched_ok = false` or unclear evidence ⇒ `NEEDS_MORE_EVIDENCE` (never auto-pass).
- `score` is an integer 0–100. JSON only, no prose outside the object.
- Validators compare on `verdict`, `handle_match`, `code_found` (derived enums/booleans) — not raw text.

## 3. Identity record JSON (stored in `identities`, only on VERIFIED)
```json
{
  "address": "0x0000000000000000000000000000000000000000",
  "platform": "github",
  "handle": "alice",
  "status": "VERIFIED",
  "evidence_uri": "https://gist.github.com/alice/abc123",
  "evidence_hash": "0x...",
  "verified_at": 1718800400,
  "confidence": "HIGH",
  "reasons": ["author handle matches", "exact challenge code present"]
}
```
- `status` ∈ `VERIFIED | REVOKED`
- `evidence_hash` lets the link survive a later-deleted post as an audit trail.

## 4. Stats JSON (returned by `get_stats`)
```json
{
  "total_challenges": 0,
  "total_verified": 0,
  "by_platform": { "github": 0, "x": 0, "url": 0 }
}
```

## 5. Normalization rules (apply before keys/comparisons)
- `handle`: trim, lowercase, strip a single leading `@`.
- `platform`: trim, lowercase; MVP allow-list `["github", "url"]` (extend later).
- `evidence_uri`: must be a syntactically valid `http(s)://` URL.
- Map keys: `challenges` → `"{address}:{platform}:{handle}"`, `identities` → `"{platform}:{handle}"`.
