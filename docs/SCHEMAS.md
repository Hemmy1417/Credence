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
  "challenge_code": "credence-a1b2c3-0",
  "status": "PENDING",
  "instructions": "Post the exact text 'credence-a1b2c3-0' on a public github page, then submit its URL.",
  "seq": 0
}
```
- `status` ∈ `PENDING | CONSUMED`
- `challenge_code` = `credence-{last6 of address}-{seq}` — deterministic, unique and address-bound, computed without any hashing library (GenVM has no guaranteed `hashlib`).
- `seq` is a monotonic counter used in place of a wall-clock timestamp (GenVM has no guaranteed clock).

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
  "verified_seq": 0,
  "confidence": "HIGH",
  "reasons": ["author handle matches", "exact challenge code present"]
}
```
- `status` ∈ `VERIFIED | REVOKED`
- `evidence_uri` is the stored audit trail (the public proof URL). A separate cryptographic
  `evidence_hash` was dropped for the MVP because GenVM has no guaranteed `hashlib`; it can be
  re-added later via a GenVM-native hashing primitive if needed.
- `verified_seq` is a monotonic counter (no wall-clock timestamp in GenVM).

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
