"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/wallet";

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export function ConnectButton() {
  const { address, method, connecting, hasMetaMask, connectBuiltIn, connectMetaMask, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function onMetaMask() {
    setErr("");
    try {
      await connectMetaMask();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function onBuiltIn() {
    setErr("");
    connectBuiltIn();
    setOpen(false);
  }

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          address
            ? "btn-ghost notch px-3.5 py-2 text-[0.65rem] flex items-center gap-2"
            : "btn-gold notch px-4 py-2 text-[0.65rem]"
        }
      >
        {address ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-ok" />
            <span className="font-mono normal-case tracking-normal">{short(address)}</span>
          </>
        ) : connecting ? (
          "Connecting…"
        ) : (
          "Connect Wallet"
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 panel notch p-2 z-30 bg-black">
          {address ? (
            <div className="p-2">
              <div className="text-[0.65rem] uppercase tracking-wider text-foreground/40">
                {method === "metamask" ? "MetaMask" : "Instant Wallet"}
              </div>
              <div className="font-mono text-sm text-gold-bright break-all mt-1">{address}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={copy} className="btn-ghost notch px-3 py-1.5 text-[0.6rem] flex-1">
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                  className="btn-ghost notch px-3 py-1.5 text-[0.6rem] flex-1"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="p-1">
              <p className="px-2 py-2 text-[0.65rem] uppercase tracking-wider text-foreground/40">
                Choose a wallet
              </p>
              {/* Instant Wallet — primary, recommended */}
              <button
                onClick={onBuiltIn}
                className="w-full text-left px-3 py-3 border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">⚡ Instant Wallet</span>
                  <span className="display text-[0.5rem] tracking-[0.15em] px-1.5 py-0.5 bg-ok/15 text-ok border border-ok/30">
                    Recommended
                  </span>
                </div>
                <div className="text-xs text-foreground/45 mt-0.5">
                  No extension · gas sponsored on Studionet
                </div>
              </button>
              {/* MetaMask — beta */}
              <button
                onClick={onMetaMask}
                disabled={!hasMetaMask}
                className="w-full text-left px-3 py-3 mt-1 hover:bg-gold/10 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">🦊 MetaMask</span>
                  <span className="display text-[0.5rem] tracking-[0.15em] px-1.5 py-0.5 bg-warn/15 text-warn border border-warn/30">
                    Beta
                  </span>
                </div>
                <div className="text-xs text-foreground/45 mt-0.5">
                  {hasMetaMask ? "Experimental on Studionet" : "Not detected"}
                </div>
              </button>
              {err && <p className="px-3 py-2 text-xs text-bad break-words">{err}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
