import { CONTRACT_CONFIGURED } from "@/lib/config";

// Renders a clear setup warning when no contract address is configured.
// Prevents the confusing "everything is empty and I don't know why" state
// that happens when NEXT_PUBLIC_CONTRACT_ADDRESS is missing on the host.
export function ConfigNotice() {
  if (CONTRACT_CONFIGURED) return null;
  return (
    <div className="mx-auto max-w-2xl px-5 pt-6">
      <div className="border border-warn/40 bg-warn/10 p-4 text-sm text-warn break-words">
        <p className="display tracking-[0.08em] text-warn">Contract not configured</p>
        <p className="mt-2 normal-case text-warn/90">
          <code className="font-mono">NEXT_PUBLIC_CONTRACT_ADDRESS</code> is missing or invalid, so
          the app can&apos;t reach the GenLayer contract. Set it in your environment (locally in{" "}
          <code className="font-mono">.env.local</code>, or in your host&apos;s environment variables)
          and reload.
        </p>
      </div>
    </div>
  );
}
