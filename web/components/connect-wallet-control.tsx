"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnect, useConnectors, type Connector } from "wagmi";
import { explainError } from "@/lib/errors";
import { useMounted } from "@/lib/use-mounted";

type ConnectWalletControlProps = {
  label?: string;
  compact?: boolean;
  align?: "left" | "right";
};

function getDisplayConnectors(connectors: readonly Connector[]) {
  const named = connectors.filter((c) => c.id !== "injected");
  if (named.length > 0) {
    const seen = new Set<string>();
    return named.filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return [...connectors];
}

export function ConnectWalletControl({
  label = "Connect wallet",
  compact = false,
  align = "left",
}: ConnectWalletControlProps) {
  const mounted = useMounted();
  const connectors = useConnectors();
  const connect = useConnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const [missingProvider, setMissingProvider] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const available = useMemo(() => getDisplayConnectors(connectors), [connectors]);
  const multiple = mounted && available.length > 1;

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function connectWith(connector: Connector | undefined) {
    setMenuOpen(false);
    if (!connector) {
      setMissingProvider(true);
      return;
    }
    setMissingProvider(false);
    connect.mutate({ connector });
  }

  function handlePrimaryClick() {
    if (available.length === 0) {
      setMissingProvider(true);
      return;
    }
    if (multiple) {
      setMissingProvider(false);
      setMenuOpen((prev) => !prev);
      return;
    }
    connectWith(available[0]);
  }

  const connectError = connect.error;
  const noProvider =
    missingProvider || Boolean(connectError && /no provider|not found/i.test(connectError.message));
  const errorText = noProvider
    ? "No browser wallet found. Install MetaMask or another EVM wallet."
    : connectError
      ? explainError(connectError, "connect")
      : null;

  return (
    <div
      ref={wrapRef}
      className={`wallet-connect-wrap ${align === "right" ? "wallet-connect-right" : ""}`}
    >
      <button
        type="button"
        className={`btn-primary ${compact ? "btn-sm" : ""}`}
        disabled={connect.isPending}
        aria-expanded={multiple ? menuOpen : undefined}
        aria-haspopup={multiple ? "menu" : undefined}
        onClick={handlePrimaryClick}
      >
        {connect.isPending ? "Check wallet…" : multiple ? `${label} ▾` : label}
      </button>

      {multiple && menuOpen && (
        <div
          role="menu"
          className={`wallet-menu ${align === "right" ? "wallet-menu-right" : ""}`}
          aria-label="Choose wallet"
        >
          {available.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              role="menuitem"
              className="wallet-menu-item"
              onClick={() => connectWith(connector)}
            >
              <span>{connector.name === "Injected" ? "Browser Wallet" : connector.name}</span>
            </button>
          ))}
        </div>
      )}

      {errorText && (
        <p
          role="alert"
          className={`text-xs text-[var(--danger)] ${align === "right" ? "max-w-xs text-right" : ""}`}
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
