"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ConnectWalletControl } from "@/components/connect-wallet-control";
import {
  certiChain,
  contractAddress,
  getExplorerTxUrl,
  Status,
  targetChain,
} from "@/lib/contract";
import { explainError } from "@/lib/errors";
import { hashCertificateId } from "@/lib/hash";
import { useIssuerGuard } from "@/lib/use-issuer-guard";

export function RevokeForm() {
  const {
    mounted,
    address,
    chainId,
    isConnected,
    wrongChain,
    ownerRead,
    ownerAddress,
    notOwner,
    switchChain,
  } = useIssuerGuard();
  const [certId, setCertId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const prevWalletRef = useRef(`${address ?? ""}:${chainId ?? ""}`);

  const certIdHash = useMemo(() => (certId.trim() ? hashCertificateId(certId) : undefined), [certId]);

  const currentStatus = useReadContract({
    ...certiChain,
    functionName: "getCertificateStatus",
    args: certIdHash ? [certIdHash] : undefined,
    query: { enabled: Boolean(contractAddress && certIdHash) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: targetChain.id });

  const { refetch: refetchStatus } = currentStatus;
  useEffect(() => {
    if (receipt.isSuccess) {
      refetchStatus();
    }
  }, [receipt.isSuccess, refetchStatus]);

  const { reset: resetWrite } = write;
  useEffect(() => {
    const walletKey = `${address ?? ""}:${chainId ?? ""}`;
    if (prevWalletRef.current !== walletKey) {
      prevWalletRef.current = walletKey;
      resetWrite();
    }
  }, [address, chainId, resetWrite]);

  if (!contractAddress) return null;

  const busy = write.isPending || receipt.isLoading;
  const error = write.error ?? receipt.error ?? switchChain.error;
  const errorStage = switchChain.error && !write.error && !receipt.error ? "chain" : "tx";
  const statusData = currentStatus.data;
  const canRevoke =
    Boolean(certId.trim()) &&
    confirmed &&
    !ownerRead.isError &&
    Boolean(ownerAddress) &&
    !notOwner &&
    (statusData === undefined || statusData === Status.Valid);
  const explorerUrl = getExplorerTxUrl(write.data);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!contractAddress || !canRevoke) return;
    write.reset();
    write.mutate(
      {
        ...certiChain,
        address: contractAddress,
        functionName: "revokeCertificate",
        args: [hashCertificateId(certId)],
      },
      {
        onSuccess: () => {
          setConfirmed(false);
        },
      },
    );
  }

  return (
    <details className="panel panel-collapsible">
      <summary className="collapsible-summary">
        <span>Revoke an existing certificate</span>
        <span className="collapsible-sub">Optional</span>
      </summary>

      <div className="collapsible-body">
        <p className="panel-note">
          Cancel a certificate permanently. Only the owner wallet can do this.
        </p>

        <form className="revoke-form" onSubmit={onSubmit}>
          <div className="revoke-row">
            <div className="field">
              <label htmlFor="revoke-cert-id">Certificate ID</label>
              <input
                id="revoke-cert-id"
                value={certId}
                onChange={(e) => {
                  if (receipt.isSuccess || write.error || receipt.error) {
                    write.reset();
                  }
                  setCertId(e.target.value);
                  setConfirmed(false);
                }}
                placeholder="CERT-2026-001"
                required
              />
            </div>

            <div className="revoke-action">
              {!mounted || !isConnected ? (
                <ConnectWalletControl label="Connect wallet" compact />
              ) : wrongChain ? (
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={switchChain.isPending}
                  onClick={() => switchChain.mutate({ chainId: targetChain.id })}
                >
                  {switchChain.isPending ? "Switching…" : `Switch to ${targetChain.name}`}
                </button>
              ) : (
                <button type="submit" className="btn-danger" disabled={busy || !canRevoke}>
                  {write.isPending
                    ? "Confirm in wallet…"
                    : receipt.isLoading
                      ? "Waiting for block…"
                      : "Revoke"}
                </button>
              )}
            </div>
          </div>

          {mounted && isConnected && notOwner && (
            <p className="panel-note text-sm field-hint-warn">
              Only the owner wallet can revoke certificates.
            </p>
          )}

          {certId.trim() && currentStatus.isFetching && (
            <p className="panel-note text-sm">Checking on-chain status…</p>
          )}

          {certId.trim() && !currentStatus.isFetching && statusData !== undefined && (
            <p className="panel-note text-sm">
              On-chain status:{" "}
              <strong>
                {statusData === Status.Valid
                  ? "VALID (can be revoked)"
                  : statusData === Status.Revoked
                    ? "Already REVOKED"
                    : "Not found (INVALID)"}
              </strong>
            </p>
          )}

          {mounted && isConnected && !wrongChain && !notOwner && certId.trim() && statusData === Status.Valid && (
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>Confirm permanent revocation of this certificate.</span>
            </label>
          )}
        </form>

        {mounted && isConnected && error && (
          <p role="alert" className="status-error">
            {explainError(error, errorStage)}
          </p>
        )}
        {mounted && isConnected && receipt.isSuccess && (
          <p role="status" className="status-ok">
            Certificate cancelled (REVOKED).
            {explorerUrl && (
              <>
                {" "}
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-[var(--teal)]"
                >
                  View transaction
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </details>
  );
}
