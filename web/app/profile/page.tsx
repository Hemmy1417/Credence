"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CredenceMark } from "@/components/Logo";
import { ScoreRing } from "@/components/ScoreRing";
import { useWallet } from "@/lib/wallet";
import {
  getIdentitiesByAddress,
  getScore,
  type Identity,
  type OnchainScore,
} from "@/lib/credence";
import { tierColor } from "@/lib/score";
import { METHODS, PLATFORMS, type Platform } from "@/lib/config";

function labelFor(platform: string) {
  return METHODS.find((m) => m.platform === platform)?.label ?? platform;
}

export default function ProfileHubPage() {
  const router = useRouter();
  const { address, connectBuiltIn } = useWallet();

  const [identities, setIdentities] = useState<Identity[]>([]);
  const [score, setScore] = useState<OnchainScore | null>(null);
  const [loading, setLoading] = useState(false);

  const [platform, setPlatform] = useState<Platform>("github");
  const [handle, setHandle] = useState("");

  const load = useCallback(async () => {
    if (!address) {
      setIdentities([]);
      setScore(null);
      return;
    }
    setLoading(true);
    try {
      const [ids, sc] = await Promise.all([
        getIdentitiesByAddress(address),
        getScore(address),
      ]);
      setIdentities(ids.filter((i) => i.status === "VERIFIED"));
      setScore(sc);
    } catch {
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const h = handle.trim().toLowerCase().replace(/^@/, "");
    if (!h) return;
    router.push(`/u/${platform}/${h}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="eyebrow text-[0.7rem] text-gold/80">Profiles</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">
        Credence <span className="gold-text">profiles</span>
      </h1>
      <p className="mt-3 text-foreground/50 normal-case">
        A profile is a public, shareable page for one wallet — its Credence Score, every verified
        link, and an embeddable badge. View yours or look up anyone&apos;s.
      </p>

      {/* your identities */}
      <section className="panel notch p-7 mt-9">
        <h2 className="display tracking-[0.08em] text-lg">Your profile</h2>

        {!address ? (
          <div className="mt-4">
            <p className="text-sm text-foreground/55 normal-case">
              Connect a wallet to see the identities linked to it.
            </p>
            <button onClick={connectBuiltIn} className="btn-gold notch px-5 py-2.5 text-xs mt-4">
              ⚡ Create Instant Wallet
            </button>
          </div>
        ) : loading ? (
          <p className="mt-4 text-foreground/45 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-gold" /> Reading the contract…
          </p>
        ) : identities.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-foreground/55 normal-case">
              This wallet has no verified identities yet.
            </p>
            <Link href="/verify" className="btn-gold notch inline-block px-5 py-2.5 text-xs mt-4">
              Verify an identity →
            </Link>
          </div>
        ) : (
          <>
            {score && (
              <div className="mt-5 flex items-center gap-5">
                <ScoreRing score={score.score} color={tierColor(score.tier)} size={96} />
                <div>
                  <p className="eyebrow text-[0.7rem] text-foreground/40">Credence Score · on-chain</p>
                  <h3 className="display text-xl mt-1" style={{ color: tierColor(score.tier) }}>
                    {score.tier}
                  </h3>
                  <p className="mt-1 text-sm text-foreground/50 normal-case">
                    {score.links} verified link{score.links === 1 ? "" : "s"} on this wallet.
                  </p>
                </div>
              </div>
            )}

            <ul className="mt-6 space-y-2.5">
              {identities.map((id) => (
                <li key={`${id.platform}/${id.handle}`}>
                  <Link
                    href={`/u/${id.platform}/${id.handle}`}
                    className="flex items-center justify-between gap-3 border border-gold/15 bg-black/40 px-4 py-3 hover:border-gold/40 transition-colors group"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <CredenceMark size={22} />
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wider text-foreground/40">
                          {labelFor(id.platform)}
                        </span>
                        <span className="block font-mono text-gold-bright truncate">
                          {id.handle}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs text-foreground/40 group-hover:text-gold-bright shrink-0">
                      View →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* look up any profile */}
      <section className="panel notch p-7 mt-5">
        <h2 className="display tracking-[0.08em] text-lg">Look up a profile</h2>
        <p className="mt-2 text-sm text-foreground/50 normal-case">
          Open the public Credence profile for any handle.
        </p>
        <form onSubmit={lookup} className="mt-4 flex flex-col sm:flex-row gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="field px-3 py-2.5 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-black">
                {labelFor(p)}
              </option>
            ))}
          </select>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle to view"
            className="field flex-1 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={!handle.trim()}
            className="btn-gold notch px-5 py-2.5 text-xs"
          >
            View profile
          </button>
        </form>
      </section>
    </div>
  );
}
