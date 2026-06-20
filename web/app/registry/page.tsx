"use client";

import { useEffect, useState } from "react";
import { PLATFORMS, type Platform } from "@/lib/config";
import { getLatest, getStats, resolveHandle, type Identity, type Stats } from "@/lib/credence";

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function RegistryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [latest, setLatest] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [platform, setPlatform] = useState<Platform>("github");
  const [handle, setHandle] = useState("");
  const [resolved, setResolved] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [s, l] = await Promise.all([getStats(), getLatest(20)]);
      setStats(s);
      setLatest(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onResolve() {
    setResolving(true);
    setResolved(null);
    try {
      setResolved((await resolveHandle(platform, handle.trim())) || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolving(false);
    }
  }

  const cards: [string | number, string][] = [
    [stats?.total_verified ?? "—", "Verified identities"],
    [stats?.total_challenges ?? "—", "Challenges issued"],
    [stats?.by_platform?.github ?? "—", "GitHub verified"],
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow text-[0.7rem] text-gold/80">Public ledger</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl">
            Verified <span className="gold-text">registry</span>
          </h1>
        </div>
        <button onClick={refresh} className="btn-ghost notch px-4 py-2 text-[0.65rem]">
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="mt-8 grid grid-cols-3 gap-px bg-gold/10 border border-gold/15">
        {cards.map(([v, l]) => (
          <div key={l} className="bg-black p-5">
            <div className="display text-3xl gold-text">{v}</div>
            <div className="text-[0.7rem] uppercase tracking-wider text-foreground/45 mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* resolver */}
      <section className="panel notch p-7 mt-6">
        <h2 className="display tracking-[0.08em] text-lg">
          Resolve a handle <span className="text-gold">→</span> address
        </h2>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="field px-3 py-2.5 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-black">
                {p}
              </option>
            ))}
          </select>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle to look up"
            className="field flex-1 px-3 py-2.5 text-sm"
          />
          <button
            onClick={onResolve}
            disabled={!handle.trim() || resolving}
            className="btn-gold notch px-5 py-2.5 text-xs"
          >
            {resolving ? "…" : "Resolve"}
          </button>
        </div>
        {resolved !== null && (
          <p className="mt-4 text-sm">
            {resolved ? (
              <>
                <span className="text-foreground/45 uppercase tracking-wider text-xs">
                  Linked address:{" "}
                </span>
                <span className="font-mono text-ok break-all">{resolved}</span>
              </>
            ) : (
              <span className="text-warn">No verified identity for that handle.</span>
            )}
          </p>
        )}
      </section>

      {/* latest list */}
      <section className="mt-10">
        <p className="eyebrow text-[0.7rem] text-foreground/40 mb-4">Latest verifications</p>
        {loading ? (
          <p className="text-foreground/45 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-gold" /> Reading from the
            contract…
          </p>
        ) : latest.length === 0 ? (
          <p className="text-foreground/45 text-sm">No verified identities yet.</p>
        ) : (
          <ul className="divide-y divide-gold/10 border border-gold/15">
            {latest.map((id) => (
              <li
                key={`${id.platform}:${id.handle}`}
                className="p-5 flex items-center justify-between panel-hover bg-black"
              >
                <div>
                  <div className="font-medium">
                    <span className="text-foreground/50">{id.platform}/</span>
                    <span className="text-gold-bright">{id.handle}</span>
                  </div>
                  <div className="text-xs text-foreground/40 font-mono mt-0.5">{short(id.address)}</div>
                </div>
                <span className="display text-[0.65rem] tracking-[0.15em] px-3 py-1 bg-ok/10 text-ok border border-ok/30">
                  {id.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-3 text-sm text-bad break-words">{error}</p>}
      </section>
    </div>
  );
}
