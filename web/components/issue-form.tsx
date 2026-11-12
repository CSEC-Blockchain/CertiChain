"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CertificateDocument } from "@/components/certificate-document";
import { ConnectWalletControl } from "@/components/connect-wallet-control";
import {
  certiChain,
  contractAddress,
  formatAddress,
  getExplorerTxUrl,
  Status,
  targetChain,
} from "@/lib/contract";
import { explainError } from "@/lib/errors";
import { buildVerifyPath, hashCertificateData, hashCertificateId } from "@/lib/hash";
import { useIssuerGuard } from "@/lib/use-issuer-guard";

type SharePayload = {
  studentName: string;
  course: string;
  certId: string;
  issueDate: string;
};

export function IssueForm() {
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

  const [studentName, setStudentName] = useState("");
  const [course, setCourse] = useState("");
  const [certId, setCertId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [share, setShare] = useState<SharePayload | null>(null);
  const prevWalletRef = useRef(`${address ?? ""}:${chainId ?? ""}`);

  const certIdHash = useMemo(() => (certId.trim() ? hashCertificateId(certId) : undefined), [certId]);

  const existingStatus = useReadContract({
    ...certiChain,
    functionName: "getCertificateStatus",
    args: certIdHash ? [certIdHash] : undefined,
    query: { enabled: Boolean(contractAddress && certIdHash) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: targetChain.id });

  const { refetch: refetchExisting } = existingStatus;
  useEffect(() => {
    if (receipt.isSuccess) {
      refetchExisting();
    }
  }, [receipt.isSuccess, refetchExisting]);

  const { reset: resetWrite } = write;
  useEffect(() => {
    const walletKey = `${address ?? ""}:${chainId ?? ""}`;
    if (prevWalletRef.current !== walletKey) {
      prevWalletRef.current = walletKey;
      resetWrite();
    }
  }, [address, chainId, resetWrite]);

  const shareQuery = useMemo(() => (share ? buildVerifyPath(share) : null), [share]);

  const issuedLink = useMemo(() => {
    if (!mounted || !receipt.isSuccess || !shareQuery) return null;
    return `${window.location.origin}${shareQuery}`;
  }, [mounted, receipt.isSuccess, shareQuery]);

  const canSubmit = useMemo(
    () => Boolean(studentName.trim() && course.trim() && certId.trim() && issueDate.trim()),
    [studentName, course, certId, issueDate],
  );

  if (!contractAddress) {
    return (
      <section className="panel">
        <p className="panel-note">Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.</p>
      </section>
    );
  }

  const alreadyExists =
    !receipt.isSuccess &&
    (existingStatus.data === Status.Valid || existingStatus.data === Status.Revoked);
  const busy = write.isPending || receipt.isLoading;
  const error = write.error ?? receipt.error ?? switchChain.error;
  const errorStage = switchChain.error && !write.error && !receipt.error ? "chain" : "tx";
  const explorerUrl = getExplorerTxUrl(write.data);

  function resetAfterEdit() {
    if (receipt.isSuccess || write.error || receipt.error) {
      write.reset();
      setShare(null);
      setCopyStatus("idle");
    }
  }

  function setToday() {
    resetAfterEdit();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setIssueDate(`${yyyy}-${mm}-${dd}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!contractAddress || !canSubmit || ownerRead.isError || !ownerAddress || notOwner || alreadyExists) return;
    const payload: SharePayload = {
      studentName: studentName.trim(),
      course: course.trim(),
      certId: certId.trim(),
      issueDate: issueDate.trim(),
    };
    setShare(payload);
    setCopyStatus("idle");
    write.reset();
    write.mutate({
      ...certiChain,
      address: contractAddress,
      functionName: "issueCertificate",
      args: [
        hashCertificateId(payload.certId),
        hashCertificateData(payload.studentName, payload.course, payload.certId, payload.issueDate),
      ],
    });
  }

  function handleReset() {
    write.reset();
    setShare(null);
    setStudentName("");
    setCourse("");
    setCertId("");
    setIssueDate("");
  }

  return (
    <section className="panel">
      {mounted && ownerRead.isError && (
        <div role="alert" className="callout callout-warn">
          {explainError(ownerRead.error, "chain")}
          {targetChain.id === 31337 &&
            " Make sure `npm run node` and `npm run deploy:local:reset` have run in CertiChain/contracts."}
        </div>
      )}

      {notOwner && (
        <div role="alert" className="callout callout-warn">
          Connected wallet <span className="font-mono">{formatAddress(address)}</span> is not the
          owner (<span className="font-mono">{formatAddress(ownerAddress)}</span>). Switch to the
          owner account to issue certificates.
          {targetChain.id === 31337 && " On Hardhat Local, use Account #0."}
        </div>
      )}

      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field">
          <span>Student name</span>
          <input
            value={studentName}
            onChange={(e) => {
              resetAfterEdit();
              setStudentName(e.target.value);
            }}
            placeholder="Ada Lovelace"
            required
          />
        </label>

        <label className="field">
          <span>Course / program</span>
          <input
            value={course}
            onChange={(e) => {
              resetAfterEdit();
              setCourse(e.target.value);
            }}
            placeholder="Computer Science"
            required
          />
        </label>

        <div className="field">
          <label htmlFor="issue-cert-id">Certificate ID</label>
          <input
            id="issue-cert-id"
            value={certId}
            onChange={(e) => {
              resetAfterEdit();
              setCertId(e.target.value);
            }}
            placeholder="CERT-2026-001"
            required
          />
          {alreadyExists && (
            <span className="field-hint field-hint-warn">
              This Certificate ID is already recorded (
              {existingStatus.data === Status.Revoked ? "REVOKED" : "VALID"}). Use a unique ID.
            </span>
          )}
        </div>

        <div className="field">
          <div className="field-label-row">
            <label htmlFor="issue-date">Issue date</label>
            <button type="button" className="inline-link-btn" onClick={setToday}>
              Today
            </button>
          </div>
          <input
            id="issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => {
              resetAfterEdit();
              setIssueDate(e.target.value);
            }}
            required
          />
        </div>

        <div className="form-actions col-span-full">
          {!mounted || !isConnected ? (
            <div className="inline-connect">
              <ConnectWalletControl label="Connect wallet" />
              <span className="panel-note">Connect the institution wallet to issue.</span>
            </div>
          ) : wrongChain ? (
            <button
              type="button"
              className="btn-primary"
              disabled={switchChain.isPending}
              onClick={() => switchChain.mutate({ chainId: targetChain.id })}
            >
              {switchChain.isPending ? "Switching…" : `Switch to ${targetChain.name}`}
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  busy || !canSubmit || ownerRead.isError || !ownerAddress || notOwner || alreadyExists
                }
              >
                {write.isPending
                  ? "Confirm in wallet…"
                  : receipt.isLoading
                    ? "Waiting for block…"
                    : "Issue Certificate"}
              </button>
              <span className="panel-note">Only a secure hash is saved on-chain—not personal data.</span>
            </>
          )}
        </div>
      </form>

      {mounted && isConnected && error && (
        <p role="alert" className="status-error">
          {explainError(error, errorStage)}
        </p>
      )}

      {issuedLink && share && (
        <div className="issue-success" role="status">
          <div className="issue-success-head">
            <div>
              <p className="status-ok">Certificate issued successfully</p>
              <p className="panel-note">
                Share the verification link or download the QR code below.
              </p>
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={handleReset}>
              Issue another
            </button>
          </div>

          <CertificateDocument
            studentName={share.studentName}
            course={share.course}
            certId={share.certId}
            issueDate={share.issueDate}
            status="issued"
            verifyUrl={issuedLink}
            proofHash={hashCertificateData(
              share.studentName,
              share.course,
              share.certId,
              share.issueDate,
            )}
            showShareActions
            actions={
              shareQuery ? (
                <Link href={shareQuery} className="btn-ghost btn-sm">
                  Open Verify
                </Link>
              ) : null
            }
          />

          <div className="share-meta no-print">
            <div className="share-meta-row">
              <span className="share-meta-label">Shareable verify link</span>
              <p className="share-url break-all">{issuedLink}</p>
            </div>
            {write.data && (
              <p className="share-meta-tx">
                <span>Tx:</span>{" "}
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[var(--teal)]"
                  >
                    <code>{formatAddress(write.data)}</code>
                  </a>
                ) : (
                  <code className="break-all">{formatAddress(write.data)}</code>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
