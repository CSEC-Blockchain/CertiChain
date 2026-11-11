"use client";

import { useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectWalletControl } from "@/components/connect-wallet-control";
import { formatAddress, targetChain } from "@/lib/contract";
import { explainError } from "@/lib/errors";
import { useMounted } from "@/lib/use-mounted";

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useConnection();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!mounted) {
    return (
      <span className="wallet-skeleton" aria-hidden="true">
        …
      </span>
    );
  }

  if (isConnected && address) {
    const wrongChain = chainId !== targetChain.id;
    return (
      <div className="wallet-connect-wrap wallet-connect-right">
        <div className="wallet-bar">
          {wrongChain && (
            <button
              type="button"
              className="chain-pill chain-pill-warn"
              disabled={switchChain.isPending}
              onClick={() => switchChain.mutate({ chainId: targetChain.id })}
              title={`Switch network to ${targetChain.name}`}
            >
              {switchChain.isPending ? "Switching…" : `Switch to ${targetChain.name}`}
            </button>
          )}
          <button
            type="button"
            className="btn-ghost btn-sm wallet-connected-btn"
            onClick={() => disconnect.mutate()}
            title={`Connected on ${targetChain.name} · Click to disconnect`}
          >
            {!wrongChain && <span className="chain-dot" aria-hidden="true" />}
            <span>{formatAddress(address)}</span>
            <span className="wallet-sep">·</span>
            <span>Disconnect</span>
          </button>
        </div>
        {wrongChain && switchChain.error && (
          <p role="alert" className="max-w-xs text-right text-xs text-[var(--danger)]">
            {explainError(switchChain.error, "chain")}
          </p>
        )}
      </div>
    );
  }

  return <ConnectWalletControl label="Connect wallet" compact align="right" />;
}
