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

  // resolver
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
      const addr = await resolveHandle(platform, handle.trim());
      setResolved(addr || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Verified registry</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5">
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-bold text-brand">{stats?.total_verified ?? "—"}</div>
          <div className="text-xs text-white/50">verified identities</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats?.total_challenges ?? "—"}</div>
          <div className="text-xs text-white/50">challenges issued</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold">{stats?.by_platform?.github ?? "—"}</div>
          <div className="text-xs text-white/50">github verified</div>
        </div>
      </div>

      {/* resolver */}
      <section className="card p-6 mt-6">
        <h2 className="font-semibold">Resolve a handle → address</h2>
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
            placeholder="handle to look up"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none"
          />
          <button
            onClick={onResolve}
            disabled={!handle.trim() || resolving}
            className="px-4 py-2 rounded-lg bg-brand text-white font-medium disabled:opacity-40"
          >
            {resolving ? "…" : "Resolve"}
          </button>
        </div>
        {resolved !== null && (
          <p className="mt-3 text-sm">
            {resolved ? (
              <>
                <span className="text-white/50">Linked address: </span>
                <span className="font-mono text-ok">{resolved}</span>
              </>
            ) : (
              <span className="text-warn">No verified identity for that handle.</span>
            )}
          </p>
        )}
      </section>

      {/* latest list */}
      <section className="mt-8">
        <h2 className="font-semibold mb-3">Latest verifications</h2>
        {loading ? (
          <p className="text-white/50 text-sm">Loading from the contract…</p>
        ) : latest.length === 0 ? (
          <p className="text-white/50 text-sm">No verified identities yet.</p>
        ) : (
          <ul className="space-y-2">
            {latest.map((id) => (
              <li key={`${id.platform}:${id.handle}`} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {id.platform}/<span className="text-brand-2">{id.handle}</span>
                  </div>
                  <div className="text-xs text-white/45 font-mono">{short(id.address)}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-ok/15 text-ok border border-ok/30">
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
