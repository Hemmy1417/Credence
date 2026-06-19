# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# ^ REQUIRED runner header (first TWO lines): version line then Depends. Hash is pinned to
#   this Studio's GenVM build (copied from a built-in example); re-copy if you change network.
#
# Credence — Intelligent Contract (Phase 1 MVP)
# On-chain identity verification on GenLayer.
#
# Patterns aligned to a known-good contract that loads in this Studio build:
#   - state uses only TreeMap / u256 / str  (no DynArray — that build can't schema-gen it)
#   - LLM call:   gl.nondet.exec_prompt(prompt)
#   - web fetch:  gl.nondet.web.render(url, mode='text')   (inside an eq_principle fn)
#   - consensus:  gl.eq_principle.prompt_comparative(fn, principle)
#   - errors:     raise gl.vm.UserError(...)
#   - sender:     gl.message.sender_account

from genlayer import *
import json

ALLOWED_PLATFORMS = ("github", "url")
MAX_LEN = 256


# ----------------------------------------------------------------------- module-level helpers
def _norm(platform: str, handle: str):
    p = platform.strip().lower()
    h = handle.strip().lower()
    if h.startswith("@"):
        h = h[1:]
    if p not in ALLOWED_PLATFORMS:
        raise gl.vm.UserError(f"unsupported platform '{p}'; allowed: {ALLOWED_PLATFORMS}")
    if not h or len(h) > MAX_LEN:
        raise gl.vm.UserError("invalid handle")
    return p, h


def _ckey(address: str, platform: str, handle: str):
    return f"{address}:{platform}:{handle}"


def _ikey(platform: str, handle: str):
    return f"{platform}:{handle}"


def _make_code(address: str, platform: str, handle: str, nonce: int):
    # Deterministic, address-bound, unique — no hashing library needed.
    tail = address[-6:].lower() if len(address) >= 6 else address.lower()
    return f"credence-{tail}-{nonce}"


def _is_valid_url(uri: str):
    u = uri.strip()
    return (u.startswith("http://") or u.startswith("https://")) and len(u) <= 2048


def _parse_json(raw: str):
    s = raw.strip().replace("```json", "").replace("```", "").strip()
    start, end = s.find("{"), s.rfind("}")
    if start == -1 or end == -1:
        raise gl.vm.UserError("judgement did not return JSON")
    return json.loads(s[start:end + 1])


# ----------------------------------------------------------------------------------- contract
class Credence(gl.Contract):
    total_challenges: u256
    total_verified: u256
    challenges: TreeMap[str, str]      # "{address}:{platform}:{handle}" -> challenge JSON
    identities: TreeMap[str, str]      # "{platform}:{handle}"           -> identity JSON
    address_index: TreeMap[str, str]   # "{address}"                     -> JSON list of "platform:handle"
    verified_index: TreeMap[str, str]  # "{seq}"                         -> "platform:handle" (ordering)

    def __init__(self) -> None:
        self.total_challenges = u256(0)
        self.total_verified = u256(0)
        self.challenges = TreeMap()
        self.identities = TreeMap()
        self.address_index = TreeMap()
        self.verified_index = TreeMap()

    # -------------------------------------------------------------------------------- writes
    @gl.public.write
    def request_challenge(self, platform: str, handle: str) -> str:
        p, h = _norm(platform, handle)
        sender = str(gl.message.sender_account)
        nonce = int(self.total_challenges)
        code = _make_code(sender, p, h, nonce)
        challenge = {
            "address": sender,
            "platform": p,
            "handle": h,
            "challenge_code": code,
            "status": "PENDING",
            "instructions": f"Post the exact text '{code}' on a public {p} page, then submit its URL.",
            "seq": nonce,
        }
        self.challenges[_ckey(sender, p, h)] = json.dumps(challenge)
        self.total_challenges = u256(nonce + 1)
        return json.dumps(challenge)

    @gl.public.write
    def submit_proof(self, platform: str, handle: str, evidence_uri: str) -> str:
        p, h = _norm(platform, handle)
        sender = str(gl.message.sender_account)
        uri = evidence_uri.strip()
        if not _is_valid_url(uri):
            raise gl.vm.UserError("invalid evidence_uri")

        raw_challenge = self.challenges.get(_ckey(sender, p, h), "")
        if not raw_challenge:
            raise gl.vm.UserError("no challenge found; call request_challenge first")
        challenge = json.loads(raw_challenge)
        if challenge.get("status") != "PENDING":
            raise gl.vm.UserError("challenge is not pending")
        code = challenge["challenge_code"]

        # ---- non-deterministic judgement: fetch page + LLM verdict, agreed via consensus ----
        def judge() -> str:
            page_text = gl.nondet.web.render(uri, mode="text")
            snippet = page_text[:6000]
            prompt = f"""You are an impartial GenLayer validator verifying a social-identity claim.
Decide whether the fetched page proves the claimant controls the account.

Claim:
- platform: {p}
- expected_handle: {h}
- required_code (must appear EXACTLY): {code}

Fetched page text (truncated):
\"\"\"
{snippet}
\"\"\"

Rules:
- Return VALID JSON ONLY, no prose outside the object. Do not invent facts.
- code_found = true only if the EXACT required_code string appears in the page text.
- handle_match = true only if the page clearly belongs to / is authored by expected_handle
  (case-insensitive, ignore a leading @).
- fetched_ok = false if the page text is empty or clearly an error/blocked page.
- verdict = "VERIFIED" only if handle_match AND code_found AND fetched_ok.
  If the fetch failed or evidence is unclear, verdict = "NEEDS_MORE_EVIDENCE".
  Otherwise verdict = "REJECTED".
- verdict is one of: "VERIFIED", "REJECTED", "NEEDS_MORE_EVIDENCE".
- score is an integer 0-100. confidence is one of: "LOW", "MEDIUM", "HIGH".

Respond ONLY with this JSON:
{{"verdict":"...","handle_match":false,"code_found":false,"fetched_ok":false,"score":0,"reasons":["..."],"risk_flags":[],"confidence":"LOW"}}"""
            return gl.nondet.exec_prompt(prompt)

        principle = (
            "Outputs are equivalent if they agree on the verdict value and on the boolean "
            "fields handle_match and code_found, even if reasons are worded differently."
        )
        verdict_raw = gl.eq_principle.prompt_comparative(judge, principle)

        verdict = _parse_json(verdict_raw)
        for key, default in (("reasons", []), ("risk_flags", []), ("score", 0), ("confidence", "LOW")):
            if key not in verdict:
                verdict[key] = default

        # ---- deterministic settlement (all validators hold the same agreed verdict) ----
        if verdict.get("verdict") == "VERIFIED":
            seq = int(self.total_verified)
            ikey = _ikey(p, h)
            identity = {
                "address": sender,
                "platform": p,
                "handle": h,
                "status": "VERIFIED",
                "evidence_uri": uri,
                "verified_seq": seq,
                "confidence": verdict.get("confidence", "LOW"),
                "reasons": verdict.get("reasons", []),
            }
            self.identities[ikey] = json.dumps(identity)

            raw_list = self.address_index.get(sender, "[]")
            keys = json.loads(raw_list)
            if ikey not in keys:
                keys.append(ikey)
            self.address_index[sender] = json.dumps(keys)

            self.verified_index[str(seq)] = ikey
            self.total_verified = u256(seq + 1)

            challenge["status"] = "CONSUMED"
            self.challenges[_ckey(sender, p, h)] = json.dumps(challenge)

        return json.dumps(verdict)

    @gl.public.write
    def revoke_identity(self, platform: str, handle: str) -> str:
        p, h = _norm(platform, handle)
        sender = str(gl.message.sender_account)
        ikey = _ikey(p, h)
        raw = self.identities.get(ikey, "")
        if not raw:
            raise gl.vm.UserError("identity not found")
        identity = json.loads(raw)
        if identity.get("address") != sender:
            raise gl.vm.UserError("only the owning address may revoke this identity")
        identity["status"] = "REVOKED"
        self.identities[ikey] = json.dumps(identity)

        raw_list = self.address_index.get(sender, "[]")
        keys = [k for k in json.loads(raw_list) if k != ikey]
        self.address_index[sender] = json.dumps(keys)
        return json.dumps({"status": "REVOKED", "platform": p, "handle": h})

    # --------------------------------------------------------------------------------- views
    @gl.public.view
    def get_challenge(self, address: str, platform: str, handle: str) -> str:
        p, h = _norm(platform, handle)
        return self.challenges.get(_ckey(address, p, h), "")

    @gl.public.view
    def get_identity(self, platform: str, handle: str) -> str:
        p, h = _norm(platform, handle)
        return self.identities.get(_ikey(p, h), "")

    @gl.public.view
    def resolve_handle(self, platform: str, handle: str) -> str:
        p, h = _norm(platform, handle)
        raw = self.identities.get(_ikey(p, h), "")
        if not raw:
            return ""
        identity = json.loads(raw)
        return identity.get("address", "") if identity.get("status") == "VERIFIED" else ""

    @gl.public.view
    def is_verified(self, address: str, platform: str, handle: str) -> str:
        # Returns JSON "true"/"false" (string return — this GenVM build's schema
        # generator rejects a bare `-> bool` return type). Frontend JSON.parse() -> boolean.
        p, h = _norm(platform, handle)
        raw = self.identities.get(_ikey(p, h), "")
        if not raw:
            return json.dumps(False)
        identity = json.loads(raw)
        result = identity.get("status") == "VERIFIED" and identity.get("address") == address
        return json.dumps(result)

    @gl.public.view
    def get_identities_by_address(self, address: str) -> str:
        raw_list = self.address_index.get(address, "[]")
        out = []
        for ikey in json.loads(raw_list):
            raw = self.identities.get(ikey, "")
            if raw:
                out.append(json.loads(raw))
        return json.dumps(out)

    @gl.public.view
    def get_stats(self) -> str:
        by_platform = {plat: 0 for plat in ALLOWED_PLATFORMS}
        total = int(self.total_verified)
        for i in range(total):
            ikey = self.verified_index.get(str(i), "")
            if not ikey:
                continue
            raw = self.identities.get(ikey, "")
            if not raw:
                continue
            rec = json.loads(raw)
            if rec.get("status") == "VERIFIED":
                plat = rec.get("platform", "")
                if plat in by_platform:
                    by_platform[plat] += 1
        return json.dumps({
            "total_challenges": int(self.total_challenges),
            "total_verified": total,
            "by_platform": by_platform,
        })

    @gl.public.view
    def get_latest(self, n: int) -> str:
        count = int(n)
        total = int(self.total_verified)
        out = []
        i = total - 1
        while i >= 0 and len(out) < count:
            ikey = self.verified_index.get(str(i), "")
            if ikey:
                raw = self.identities.get(ikey, "")
                if raw:
                    rec = json.loads(raw)
                    if rec.get("status") == "VERIFIED":
                        out.append(rec)
            i -= 1
        return json.dumps(out)
