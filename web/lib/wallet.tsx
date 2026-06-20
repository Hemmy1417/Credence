"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export type WalletMethod = "builtin" | "metamask";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

type WalletState = {
  address: string;
  method: WalletMethod | null;
  client: Client | null;
  connecting: boolean;
  hasMetaMask: boolean;
  connectBuiltIn: () => void;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
};

const Ctx = createContext<WalletState | null>(null);
const PK_KEY = "credence_pk";
const METHOD_KEY = "credence_wallet_method";
const STUDIONET_HEX = "0xF22F"; // 61999

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eth(): any {
  return typeof window !== "undefined" ? (window as { ethereum?: unknown }).ethereum : undefined;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<WalletMethod | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  const connectBuiltIn = useCallback(() => {
    let pk = localStorage.getItem(PK_KEY);
    if (!pk) {
      pk = generatePrivateKey();
      localStorage.setItem(PK_KEY, pk);
    }
    const account = createAccount(pk as `0x${string}`);
    setClient(createClient({ chain: studionet, account }));
    setAddress(account.address);
    setMethod("builtin");
    localStorage.setItem(METHOD_KEY, "builtin");
  }, []);

  const connectMetaMask = useCallback(async () => {
    const provider = eth();
    if (!provider) throw new Error("MetaMask not detected. Install it, or use the Instant Wallet.");
    setConnecting(true);
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      const addr = accounts?.[0];
      if (!addr) throw new Error("No account selected.");
      // best-effort: make sure MetaMask knows the Studionet chain
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: STUDIONET_HEX,
              chainName: "GenLayer Studionet",
              rpcUrls: ["https://studio.genlayer.com/api"],
              nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            },
          ],
        });
      } catch {
        /* user may decline or chain already added — continue */
      }
      setClient(createClient({ chain: studionet, account: addr as `0x${string}` }));
      setAddress(addr);
      setMethod("metamask");
      localStorage.setItem(METHOD_KEY, "metamask");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    setClient(null);
    setMethod(null);
    localStorage.removeItem(METHOD_KEY);
  }, []);

  // restore previous session (built-in only — MetaMask needs a user gesture)
  useEffect(() => {
    setHasMetaMask(!!eth());
    if (localStorage.getItem(METHOD_KEY) === "builtin") connectBuiltIn();
  }, [connectBuiltIn]);

  return (
    <Ctx.Provider
      value={{ address, method, client, connecting, hasMetaMask, connectBuiltIn, connectMetaMask, disconnect }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used within WalletProvider");
  return v;
}
