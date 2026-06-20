"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CredenceMark } from "@/components/Logo";
import { getIdentity, type Identity } from "@/lib/credence";
import type { Platform } from "@/lib/config";

export default function ProfilePage() {
  const params = useParams<{ platform: string; handle: string }>();
  const platform = (params.platform || "").toLowerCase();
  const handle = (params.handle || "").toLowerCase().replace(/^@/, "");

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      try {
        setIdentity(await getIdentity(platform as Platform, handle));
      } catch {
        setIdentity(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [platform, handle]);

  const profileUrl = `${origin}/u/${platform}/${handle}`;
  const badgeUrl = `${origin}/api/badge/${platform}/${handle}`;
  const markdown = `[![Verified by Credence](${badgeUrl})](${profileUrl})`;

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const verified = identity?.status === "VERIFIED";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <Link
        href="/registry"
        className="text-xs uppercase tracking-wider text-foreground/40 hover:text-gold-bright"
      >
        ← Registry
      </Link>

      {loading ? (
        <p className="mt-10 text-foreground/45 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-gold" /> Reading the contract…
        </p>
      ) : (
        <>
          {/* identity seal card */}
          <section className="panel notch p-8 mt-6 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className={`absolute inset-0 blur-2xl rounded-full ${verified ? "bg-gold/25" : "bg-white/5"}`}
                />
                <CredenceMark size={64} />
              </div>
            </div>

            <p className="eyebrow text-[0.7rem] mt-5 text-foreground/40">{platform}</p>
            <h1 className="display text-4xl sm:text-5xl mt-2">{handle}</h1>

            <div className="mt-5 flex justify-center">
              {verified ? (
                <span className="display tracking-[0.18em] text-sm px-5 py-2 bg-ok/10 text-ok border border-ok/40">
                  ✓ Verified
                </span>
              ) : (
                <span className="display tracking-[0.18em] text-sm px-5 py-2 bg-warn/10 text-warn border border-warn/40">
                  Not verified
                </span>
              )}
            </div>

            {verified && identity && (
              <div className="mt-7 text-left space-y-3 text-sm">
                <Row label="Linked wallet" value={identity.address} mono />
                <Row label="Confidence" value={identity.confidence} />
                {identity.evidence_uri && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-foreground/40">Evidence</span>
                    <a
                      href={identity.evidence_uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold hover:text-gold-bright underline underline-offset-4 break-all"
                    >
                      {identity.evidence_uri}
                    </a>
                  </div>
                )}
                {identity.reasons?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-foreground/40">
                      Validator findings
                    </span>
                    <ul className="space-y-1.5 text-foreground/60">
                      {identity.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-gold">✓</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!verified && (
              <p className="mt-5 text-foreground/55 text-sm normal-case">
                No verified Credence link exists for{" "}
                <span className="font-mono text-gold-bright">{platform}/{handle}</span> yet.
              </p>
            )}
          </section>

          {/* share / embed */}
          <section className="panel notch p-7 mt-5">
            <h2 className="display tracking-[0.08em] text-lg">Share this proof</h2>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-foreground/40">Profile link</span>
                <div className="mt-1.5 flex gap-2">
                  <code className="field flex-1 px-3 py-2 text-xs font-mono break-all">{profileUrl}</code>
                  <button onClick={() => copy("link", profileUrl)} className="btn-ghost notch px-3 text-[0.6rem]">
                    {copied === "link" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-foreground/40">Live badge</span>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badgeUrl} alt="Verified by Credence" />
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-foreground/40">
                  Embed (Markdown — paste in a README)
                </span>
                <div className="mt-1.5 flex gap-2">
                  <code className="field flex-1 px-3 py-2 text-xs font-mono break-all">{markdown}</code>
                  <button onClick={() => copy("md", markdown)} className="btn-ghost notch px-3 text-[0.6rem]">
                    {copied === "md" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-foreground/40">{label}</span>
      <span className={`text-foreground/75 break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
