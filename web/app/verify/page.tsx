"use client";

import { useEffect, useState } from "react";
import { PLATFORMS, type Platform } from "@/lib/config";
import {
  myAddress,
  requestChallenge,
  submitProof,
  type Challenge,
  type ProofResult,
} from "@/lib/credence";

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function VerifyPage() {
  const [address, setAddress] = useState("");
  const [platform, setPlatform] = useState<Platform>("github");
  const [handle, setHandle] = useState("");
  const [gistUrl, setGistUrl] = useState("");

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);

  const [busy, setBusy] = useState<"" | "challenge" | "proof">("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setAddress(myAddress());
    } catch {
      /* SDK not ready until client mounts */
    }
  }, []);

  async function onRequest() {
    setError("");
    setResult(null);
    setBusy("challenge");
    try {
      const ch = await requestChallenge(platform, handle.trim());
      setChallenge(ch);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function onSubmit() {
    setError("");
    setBusy("proof");
    try {
      const r = await submitProof(platform, handle.trim(), gistUrl.trim());
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Verify your identity</h1>
      <p className="mt-2 text-white/60">
        Your GenLayer account:{" "}
        <span className="font-mono text-white/80">{address ? short(address) : "loading…"}</span>
      </p>

      {/* STEP 1 */}
      <section className="card p-6 mt-8">
        <h2 className="font-semibold">
          <span className="text-brand">Step 1.</span> Request your code
        </h2>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-[#0b1020]">
                {p}
              </option>
            ))}
          </select>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={platform === "github" ? "your GitHub username" : "your handle"}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"
          />
          <button
            onClick={onRequest}
            disabled={!handle.trim() || busy !== ""}
            className="px-4 py-2 rounded-lg bg-brand text-white font-medium disabled:opacity-40"
          >
            {busy === "challenge" ? "Working…" : "Get code"}
          </button>
        </div>

        {challenge && (
          <div className="mt-5 rounded-lg bg-black/30 border border-white/10 p-4">
            <p className="text-sm text-white/60">Post this exact text on a public {platform} page:</p>
            <p className="mt-2 font-mono text-lg text-brand-2 select-all break-all">
              {challenge.challenge_code}
            </p>
            <p className="mt-3 text-sm text-white/50">{challenge.instructions}</p>
            {platform === "github" && (
              <a
                href="https://gist.github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-sm text-brand underline"
              >
                Open gist.github.com →
              </a>
            )}
          </div>
        )}
      </section>

      {/* STEP 2 */}
      <section className={`card p-6 mt-5 ${challenge ? "" : "opacity-50 pointer-events-none"}`}>
        <h2 className="font-semibold">
          <span className="text-brand">Step 2.</span> Submit your proof
        </h2>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={gistUrl}
            onChange={(e) => setGistUrl(e.target.value)}
            placeholder="https://gist.github.com/you/…"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"
          />
          <button
            onClick={onSubmit}
            disabled={!gistUrl.trim() || busy !== ""}
            className="px-4 py-2 rounded-lg bg-brand text-white font-medium disabled:opacity-40"
          >
            {busy === "proof" ? "Verifying…" : "Submit proof"}
          </button>
        </div>
        {busy === "proof" && (
          <p className="mt-3 text-sm text-white/50">
            An AI validator panel is reading your page and reaching consensus — this can take up to a
            minute.
          </p>
        )}
      </section>

      {/* RESULT */}
      {result && (
        <section
          className={`card p-6 mt-5 border ${
            result.verified ? "border-ok/40" : "border-warn/40"
          }`}
        >
          {result.verified && result.identity ? (
            <>
              <div className="flex items-center gap-2 text-ok font-semibold text-lg">
                <span>✓</span> Verified
              </div>
              <p className="mt-2 text-white/70">
                <span className="font-mono">{result.identity.platform}/{result.identity.handle}</span>{" "}
                is now linked to your wallet on-chain.
              </p>
              <p className="mt-1 text-sm text-white/45">
                Confidence: {result.identity.confidence}
              </p>
              {result.identity.reasons?.length > 0 && (
                <ul className="mt-3 text-sm text-white/55 list-disc pl-5 space-y-1">
                  {result.identity.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-warn font-semibold text-lg">
                <span>!</span> Not verified
              </div>
              <p className="mt-2 text-white/70">
                The AI jury didn&apos;t confirm a match. Make sure the gist is{" "}
                <strong>public</strong>, belongs to <strong>{handle}</strong>, and contains the exact
                code. Then try Step 2 again.
              </p>
            </>
          )}
        </section>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm text-bad break-words">
          {error}
        </div>
      )}
    </div>
  );
}
