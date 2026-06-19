# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
# ^ REQUIRED runner header — must be the FIRST TWO lines, in this order:
#   line 1 = version (`# v0.1.0`), line 2 = the Depends comment. Without the version
#   line GenVM warns "does not start with version" and rejects with invalid_contract.
#   The Depends hash is pinned to this Studio's GenVM build (copied from a built-in example);
#   if you move to another network/version, re-copy it from that environment's examples.
#
# Credence — Intelligent Contract (Phase 1 MVP)
# On-chain identity verification on GenLayer.
#
# API grounded in the official GenLayer docs (June 2026):
#   - storage:     gl.Contract, TreeMap[K,V], u256, str, gl.storage / class-annotated state
#   - web fetch:   gl.nondet.web.render(url, mode='text')  (must run inside an eq_principle fn)
#   - LLM:         gl.exec_prompt(prompt)
#   - consensus:   gl.eq_principle.prompt_comparative(fn, principle)   (LLM judgement)
#                  gl.eq_principle.strict_eq(fn)                       (deterministic fetch)
#
# >>> VERIFY-IN-STUDIO markers below flag the 3 spots where SDK naming can drift between
# >>> versions. Load this in GenLayer Studio and confirm those symbols before deploying.

from genlayer import *
import json

ALLOWED_PLATFORMS = ("github", "url")
MAX_LEN = 256


class Credence(gl.Contract):
    owner: str
    total_challenges: u256
    total_verified: u256
    challenges: TreeMap[str, str]      # "{address}:{platform}:{handle}" -> challenge JSON
    identities: TreeMap[str, str]      # "{platform}:{handle}"           -> identity JSON
    address_index: TreeMap[str, str]   # "{address}"                     -> JSON list of "platform:handle"
    latest: DynArray[str]              # ordered "{platform}:{handle}" keys of verified identities

    def __init__(self) -> None:
        self.owner = str(gl.message.sender_address)
        self.total_challenges = u256(0)
        self.total_verified = u256(0)
        self.challenges = TreeMap()
        self.identities = TreeMap()
        self.address_index = TreeMap()
        self.latest = DynArray()

    # ------------------------------------------------------------------ helpers (deterministic)
    # NOTE: helper methods are intentionally left without return-type annotations.
    # gl.Contract validates annotations against GenLayer's own type system, which does
    # not accept builtin generics like tuple[...] or dict; annotating these breaks the
    # contract schema. Their bodies still use plain Python tuples/dicts at runtime, which
    # is fine.
    def _norm(self, platform: str, handle: str):
        p = platform.strip().lower()
        h = handle.strip().lower()
        if h.startswith("@"):
            h = h[1:]
        if p not in ALLOWED_PLATFORMS:
            raise Exception(f"unsupported platform '{p}'; allowed: {ALLOWED_PLATFORMS}")
        if not h or len(h) > MAX_LEN:
            raise Exception("invalid handle")
        return p, h

    def _ckey(self, address: str, platform: str, handle: str) -> str:
        return f"{address}:{platform}:{handle}"

    def _ikey(self, platform: str, handle: str) -> str:
        return f"{platform}:{handle}"

    def _make_code(self, address: str, platform: str, handle: str, nonce: int) -> str:
        # Deterministic + address-bound + unique, without any hashing library:
        # validators all share the same state, so this computes identically everywhere.
        tail = address[-6:].lower() if len(address) >= 6 else address.lower()
        return f"credence-{tail}-{nonce}"

    def _is_valid_url(self, uri: str) -> bool:
        u = uri.strip()
        return (u.startswith("http://") or u.startswith("https://")) and len(u) <= 2048

    def _parse_json(self, raw: str):
        # LLM output may be wrapped in ``` fences or contain stray text; extract the object.
        s = raw.strip()
        if s.startswith("```"):
            s = s.strip("`")
            if s.lower().startswith("json"):
                s = s[4:]
        start, end = s.find("{"), s.rfind("}")
        if start == -1 or end == -1:
            raise Exception("judgement did not return JSON")
        return json.loads(s[start:end + 1])

    # ------------------------------------------------------------------ writes
    @gl.public.write
    def request_challenge(self, platform: str, handle: str) -> str:
        p, h = self._norm(platform, handle)
        sender = str(gl.message.sender_address)
        nonce = int(self.total_challenges)
        code = self._make_code(sender, p, h, nonce)
        challenge = {
            "address": sender,
            "platform": p,
            "handle": h,
            "challenge_code": code,
            "status": "PENDING",
            "instructions": f"Post the exact text '{code}' on a public {p} page, then submit its URL.",
            "seq": nonce,
        }
        self.challenges[self._ckey(sender, p, h)] = json.dumps(challenge)
        self.total_challenges = u256(nonce + 1)
        return json.dumps(challenge)

    @gl.public.write
    def submit_proof(self, platform: str, handle: str, evidence_uri: str) -> str:
        p, h = self._norm(platform, handle)
        sender = str(gl.message.sender_address)
        uri = evidence_uri.strip()
        if not self._is_valid_url(uri):
            raise Exception("invalid evidence_uri")

        raw_challenge = self.challenges.get(self._ckey(sender, p, h), "")
        if not raw_challenge:
            raise Exception("no challenge found; call request_challenge first")
        challenge = json.loads(raw_challenge)
        if challenge.get("status") != "PENDING":
            raise Exception("challenge is not pending")
        code = challenge["challenge_code"]

        # ---- non-deterministic judgement: fetch page + LLM verdict, agreed via consensus ----
        def judge() -> str:
            # VERIFY-IN-STUDIO (1): web render call name/signature.
            page_text = gl.nondet.web.render(uri, mode="text")
            snippet = page_text[:6000]  # keep prompt bounded
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

JSON schema:
{{"verdict":"...","handle_match":false,"code_found":false,"fetched_ok":false,"score":0,"reasons":["..."],"risk_flags":[],"confidence":"LOW"}}"""
            # VERIFY-IN-STUDIO (2): exec_prompt call name/signature.
            return gl.exec_prompt(prompt)

        principle = (
            "Outputs are equivalent if they agree on the verdict value and on the boolean "
            "fields handle_match and code_found, even if reasons are worded differently."
        )
        # VERIFY-IN-STUDIO (3): equivalence-principle symbol. Official docs show the
        # namespaced form gl.eq_principle.prompt_comparative; some SDK builds expose the flat
        # name gl.eq_principle_prompt_comparative — use whichever the loaded SDK provides.
        verdict_raw = gl.eq_principle.prompt_comparative(judge, principle)

        verdict = self._parse_json(verdict_raw)
        verdict.setdefault("reasons", [])
        verdict.setdefault("risk_flags", [])
        verdict.setdefault("score", 0)
        verdict.setdefault("confidence", "LOW")

        # ---- deterministic settlement (all validators hold the same agreed verdict) ----
        if verdict.get("verdict") == "VERIFIED":
            identity = {
                "address": sender,
                "platform": p,
                "handle": h,
                "status": "VERIFIED",
                "evidence_uri": uri,
                "verified_seq": int(self.total_verified),
                "confidence": verdict.get("confidence", "LOW"),
                "reasons": verdict.get("reasons", []),
            }
            ikey = self._ikey(p, h)
            self.identities[ikey] = json.dumps(identity)

            raw_list = self.address_index.get(sender, "[]")
            keys = json.loads(raw_list)
            if ikey not in keys:
                keys.append(ikey)
            self.address_index[sender] = json.dumps(keys)

            self.latest.append(ikey)
            self.total_verified = u256(int(self.total_verified) + 1)

            challenge["status"] = "CONSUMED"
            self.challenges[self._ckey(sender, p, h)] = json.dumps(challenge)

        return json.dumps(verdict)

    @gl.public.write
    def revoke_identity(self, platform: str, handle: str) -> str:
        p, h = self._norm(platform, handle)
        sender = str(gl.message.sender_address)
        ikey = self._ikey(p, h)
        raw = self.identities.get(ikey, "")
        if not raw:
            raise Exception("identity not found")
        identity = json.loads(raw)
        if identity.get("address") != sender:
            raise Exception("only the owning address may revoke this identity")
        identity["status"] = "REVOKED"
        self.identities[ikey] = json.dumps(identity)

        raw_list = self.address_index.get(sender, "[]")
        keys = [k for k in json.loads(raw_list) if k != ikey]
        self.address_index[sender] = json.dumps(keys)
        return json.dumps({"status": "REVOKED", "platform": p, "handle": h})

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_challenge(self, address: str, platform: str, handle: str) -> str:
        p, h = self._norm(platform, handle)
        return self.challenges.get(self._ckey(address, p, h), "")

    @gl.public.view
    def get_identity(self, platform: str, handle: str) -> str:
        p, h = self._norm(platform, handle)
        return self.identities.get(self._ikey(p, h), "")

    @gl.public.view
    def resolve_handle(self, platform: str, handle: str) -> str:
        p, h = self._norm(platform, handle)
        raw = self.identities.get(self._ikey(p, h), "")
        if not raw:
            return ""
        identity = json.loads(raw)
        return identity.get("address", "") if identity.get("status") == "VERIFIED" else ""

    @gl.public.view
    def is_verified(self, address: str, platform: str, handle: str) -> bool:
        p, h = self._norm(platform, handle)
        raw = self.identities.get(self._ikey(p, h), "")
        if not raw:
            return False
        identity = json.loads(raw)
        return identity.get("status") == "VERIFIED" and identity.get("address") == address

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
        for ikey in self.latest:
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
            "total_verified": int(self.total_verified),
            "by_platform": by_platform,
        })

    @gl.public.view
    def get_latest(self, n: u256) -> str:
        count = int(n)
        out = []
        keys = list(self.latest)
        for ikey in reversed(keys):
            if len(out) >= count:
                break
            raw = self.identities.get(ikey, "")
            if raw:
                rec = json.loads(raw)
                if rec.get("status") == "VERIFIED":
                    out.append(rec)
        return json.dumps(out)
