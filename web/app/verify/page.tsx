"use client";

import { useState } from "react";
import Link from "next/link";
import { METHODS } from "@/lib/config";
import { CredenceMark } from "@/components/Logo";
import { formatGen, useWallet } from "@/lib/wallet";
import { requestChallenge, submitProof, type Challenge, type ProofResult } from "@/lib/credence";

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function VerifyPage() {
  const {
    address,
    client,
    method,
    connectBuiltIn,
    chainName,
    gasSponsored,
    balanceWei,
    refreshBalance,
    requestTestGen,
  } = useWallet();

  const [methodId, setMethodId] = useState("github");
  const selectedMethod = METHODS.find((m) => m.id === methodId) ?? METHODS[0];
  const [handle, setHandle] = useState("");
  const [gistUrl, setGistUrl] = useState("");

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);
  const [busy, setBusy] = useState<"" | "challenge" | "proof">("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [genMsg, setGenMsg] = useState("");
  const [funding, setFunding] = useState(false);

  const connected = !!client && !!address;
  const gasReady = gasSponsored || (balanceWei != null && balanceWei > 0n);

  async function onGetGen() {
    setGenMsg("");
    setFunding(true);
    try {
      const r = await requestTestGen();
      setGenMsg(r.message);
    } finally {
      setFunding(false);
    }
  }

  async function onRequest() {
    if (!connected) return;
    setError("");
    setResult(null);
    setBusy("challenge");
    try {
      setChallenge(await requestChallenge(client, address, selectedMethod.platform, handle.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function onSubmit() {
    if (!connected) return;
    setError("");
    setBusy("proof");
    try {
      setResult(await submitProof(client, address, selectedMethod.platform, handle.trim(), gistUrl.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  function copyCode() {
    if (!challenge) return;
    navigator.clipboard.writeText(challenge.challenge_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="eyebrow text-[0.7rem] text-gold/80">Verification</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">
        Verify your <span className="gold-text">identity</span>
      </h1>
      <p className="mt-3 text-foreground/50">
        {connected ? (
          <>
            Wallet ({method === "metamask" ? "Browser" : "Instant"}):{" "}
            <span className="font-mono text-gold-bright">{short(address)}</span>
          </>
        ) : (
          "Connect a wallet to begin."
        )}
      </p>

      {!connected ? (
        <section className="panel notch p-8 mt-9 text-center">
          <div className="flex justify-center mb-4">
            <CredenceMark size={44} />
          </div>
          <h2 className="display tracking-[0.08em] text-lg">Connect your wallet</h2>
          <p className="mt-2 text-sm text-foreground/55 normal-case">
            Your verified identity links to this wallet. The Instant Wallet is recommended — no
            extension, and gas is sponsored on Studionet. MetaMask is also available (Beta) from the
            top-right.
          </p>
          <button onClick={connectBuiltIn} className="btn-gold notch px-6 py-3 text-xs mt-6">
            ⚡ Create Instant Wallet
          </button>
        </section>
      ) : (
        <>
          {/* GAS READINESS */}
          <section className="panel notch p-6 mt-9">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="eyebrow text-[0.7rem] text-foreground/40">Gas readiness</p>
                <div className="mt-2 text-sm text-foreground/60">
                  Network: <span className="text-foreground/85">{chainName}</span>
                  <span className="mx-2 text-foreground/20">·</span>
                  Balance: <span className="font-mono text-gold-bright">{formatGen(balanceWei)} GEN</span>
                </div>
              </div>
              <span
                className={`display text-[0.65rem] tracking-[0.15em] px-3 py-1 border ${
                  gasReady ? "text-ok bg-ok/10 border-ok/40" : "text-warn bg-warn/10 border-warn/40"
                }`}
              >
                {gasReady ? "Ready" : "Needs GEN"}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/50 normal-case">
              {gasSponsored
                ? "Studionet sponsors gas, so verifying is free here. On mainnet you'd top up GEN before verifying — this step handles that."
                : "You need GEN to cover the gas fee before you can verify."}
            </p>
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <button
                onClick={onGetGen}
                disabled={funding}
                className="btn-ghost notch px-4 py-2 text-[0.65rem]"
              >
                {funding ? "Requesting…" : "Get test GEN"}
              </button>
              <button
                onClick={refreshBalance}
                className="text-xs text-foreground/40 hover:text-gold-bright transition-colors"
              >
                Refresh balance
              </button>
              {genMsg && <span className="text-xs text-foreground/55 normal-case">{genMsg}</span>}
            </div>
          </section>

          {/* STEP 1 */}
          <section
            className={`panel notch p-7 mt-5 transition-opacity ${
              gasReady ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="display gold-text text-2xl">01</span>
              <h2 className="display tracking-[0.08em] text-lg">Request your code</h2>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <select
                value={methodId}
                onChange={(e) => {
                  setMethodId(e.target.value);
                  setChallenge(null);
                  setResult(null);
                }}
                className="field px-3 py-2.5 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-black">
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder={selectedMethod.handlePlaceholder}
                className="field flex-1 px-3 py-2.5 text-sm"
              />
              <button
                onClick={onRequest}
                disabled={!handle.trim() || busy !== ""}
                className="btn-gold notch px-5 py-2.5 text-xs"
              >
                {busy === "challenge" ? "Working…" : "Get code"}
              </button>
            </div>

            {challenge && (
              <div className="mt-5 border border-gold/20 bg-black/50 p-5">
                <p className="text-xs text-foreground/50 uppercase tracking-wider">Your one-time code</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <code className="font-mono text-xl text-gold-bright select-all break-all">
                    {challenge.challenge_code}
                  </code>
                  <button onClick={copyCode} className="btn-ghost notch px-3 py-1.5 text-[0.65rem]">
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-3 text-sm text-foreground/55 normal-case">{selectedMethod.hint}</p>
                {selectedMethod.cta && selectedMethod.ctaUrl && (
                  <a
                    href={selectedMethod.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm text-gold hover:text-gold-bright underline underline-offset-4"
                  >
                    {selectedMethod.cta}
                  </a>
                )}

                {selectedMethod.id === "github" && (
                  <details className="mt-5 border-t border-gold/15 pt-4 group">
                    <summary className="cursor-pointer list-none flex items-center gap-2 text-sm text-gold hover:text-gold-bright select-none">
                      <span className="transition-transform group-open:rotate-90">›</span>
                      How to post your code on gist.github.com
                    </summary>
                    <ol className="mt-4 space-y-3 text-sm text-foreground/65 normal-case">
                      <li className="flex gap-3">
                        <span className="display gold-text shrink-0">1</span>
                        <span>
                          Sign in to GitHub as{" "}
                          <strong className="text-gold-bright">{handle.trim() || "your username"}</strong>,
                          then open{" "}
                          <a
                            href="https://gist.github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gold underline underline-offset-4 hover:text-gold-bright"
                          >
                            gist.github.com
                          </a>
                          .
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="display gold-text shrink-0">2</span>
                        <span>
                          In the big content box, paste your code exactly:{" "}
                          <code className="font-mono text-gold-bright">{challenge.challenge_code}</code>.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="display gold-text shrink-0">3</span>
                        <span>
                          Give the file any name — e.g.{" "}
                          <code className="font-mono text-foreground/80">credence.txt</code>.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="display gold-text shrink-0">4</span>
                        <span>
                          Click the green button and make sure it says{" "}
                          <strong className="text-gold-bright">Create public gist</strong> — not secret.
                          It has to be public so the validators can read it.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="display gold-text shrink-0">5</span>
                        <span>
                          Copy the page URL from your browser&apos;s address bar (it looks like{" "}
                          <code className="font-mono text-foreground/80">
                            gist.github.com/{handle.trim() || "you"}/…
                          </code>
                          ) and paste it into Step 02 below.
                        </span>
                      </li>
                    </ol>
                  </details>
                )}
              </div>
            )}
          </section>

          {/* STEP 2 */}
          <section
            className={`panel notch p-7 mt-5 transition-opacity ${
              challenge ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="display gold-text text-2xl">02</span>
              <h2 className="display tracking-[0.08em] text-lg">Submit your proof</h2>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                value={gistUrl}
                onChange={(e) => setGistUrl(e.target.value)}
                placeholder={selectedMethod.evidencePlaceholder}
                className="field flex-1 px-3 py-2.5 text-sm"
              />
              <button
                onClick={onSubmit}
                disabled={!gistUrl.trim() || busy !== ""}
                className="btn-gold notch px-5 py-2.5 text-xs"
              >
                {busy === "proof" ? "Verifying…" : "Submit proof"}
              </button>
            </div>
            {busy === "proof" && (
              <p className="mt-4 text-sm text-foreground/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-gold" />
                An AI validator panel is reading your page and reaching consensus — up to a minute.
              </p>
            )}
          </section>

          {/* RESULT */}
          {result && (
            <section
              className={`panel notch p-7 mt-5 ${result.verified ? "!border-ok/50" : "!border-warn/50"}`}
            >
              {result.verified && result.identity ? (
                <>
                  <div className="flex items-center gap-3">
                    <CredenceMark size={26} />
                    <span className="display text-ok text-xl tracking-[0.06em]">Verified</span>
                  </div>
                  <p className="mt-3 text-foreground/70">
                    <span className="font-mono text-gold-bright">
                      {result.identity.platform}/{result.identity.handle}
                    </span>{" "}
                    is now sealed to your wallet on-chain.
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-foreground/40">
                    Confidence: {result.identity.confidence}
                  </p>
                  {result.identity.reasons?.length > 0 && (
                    <ul className="mt-4 text-sm text-foreground/55 space-y-1.5 normal-case">
                      {result.identity.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-gold">✓</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/u/${result.identity.platform}/${result.identity.handle}`}
                    className="btn-gold notch inline-block px-5 py-2.5 text-xs mt-6"
                  >
                    View public profile →
                  </Link>
                </>
              ) : (
                <>
                  <span className="display text-warn text-xl tracking-[0.06em]">Not verified</span>
                  <p className="mt-3 text-foreground/70 normal-case">
                    The AI jury didn&apos;t confirm a match. Make sure the gist is{" "}
                    <strong>public</strong>, belongs to <strong>{handle}</strong>, and contains the
                    exact code. Then try Step 2 again.
                  </p>
                </>
              )}
            </section>
          )}

          {error && (
            <div className="mt-5 border border-bad/40 bg-bad/10 p-4 text-sm text-bad break-words">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
