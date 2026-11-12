"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useState, type ReactNode } from "react";
import { rasterizeSvgElementToPng } from "@/lib/qr";

export type CertificateStatusTone = "valid" | "revoked" | "issued" | "invalid";

export type CertificateDocumentProps = {
  studentName: string;
  course: string;
  certId: string;
  issueDate: string;
  status: CertificateStatusTone;
  verifyUrl?: string | null;
  recordedAt?: string;
  proofHash?: string;
  qrRef?: React.RefObject<HTMLDivElement | null>;
  showShareActions?: boolean;
  actions?: ReactNode;
};

const STATUS_COPY: Record<CertificateStatusTone, { badge: string; kicker: string }> = {
  issued: { badge: "✓ VALID · ISSUED", kicker: "Sealed on-chain · Blockchain-backed credential" },
  valid: { badge: "✓ VALID", kicker: "Verified on-chain · Blockchain-backed credential" },
  revoked: { badge: "! REVOKED", kicker: "Revoked by issuer" },
  invalid: { badge: "✕ INVALID", kicker: "Unverified credential" },
};

function SealEmblem() {
  return (
    <span className="cert-doc-seal" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5l2.3 1.7 2.8-.2 1 2.7 2.4 1.5-.6 2.8 1.4 2.5-1.9 2.1.1 2.8-2.7.9-1.6 2.3-2.7-.7-2.5 1.3-2-1.9-2.8.1-.9-2.7-2.3-1.6.7-2.7L2.5 12l1.7-2.3-.2-2.8 2.7-1 1.5-2.4 2.8.6L12 2.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8.8 12.3l2.2 2.2 4.4-4.7"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function CertificateDocument({
  studentName,
  course,
  certId,
  issueDate,
  status,
  verifyUrl,
  recordedAt,
  proofHash,
  qrRef,
  showShareActions = false,
  actions,
}: CertificateDocumentProps) {
  const localQrRef = useRef<HTMLDivElement | null>(null);
  const resolvedQrRef = qrRef ?? localQrRef;
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const isAuthentic = status === "issued" || status === "valid";
  const statusCopy = STATUS_COPY[status];

  async function handleCopyLink() {
    if (!verifyUrl) return;
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("failed");
    }
  }

  async function handleDownloadQr() {
    const svg = resolvedQrRef.current?.querySelector("svg");
    if (!svg) return;

    try {
      const pngUrl = await rasterizeSvgElementToPng(svg, { qrSize: 320, padding: 32 });
      const link = document.createElement("a");
      link.download = `certichain-${certId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
      link.href = pngUrl;
      link.click();
    } catch {
      if (verifyUrl) window.open(verifyUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <article className={`cert-doc cert-doc-${status}`} aria-label="Certificate">
      <div className="cert-doc-frame">
        <header className="cert-doc-header">
          <div className="cert-doc-brand">
            <SealEmblem />
            <div>
              <p className="cert-doc-org">CertiChain Registry</p>
              <p className="cert-doc-kicker">{statusCopy.kicker}</p>
            </div>
          </div>
          <span className={`cert-doc-status cert-doc-status-${status}`}>{statusCopy.badge}</span>
        </header>

        <p className="cert-doc-label">{isAuthentic ? "This certifies that" : "Credential record"}</p>
        <h2 className="cert-doc-name">{studentName}</h2>
        <p className="cert-doc-award">
          has completed <strong>{course}</strong>
        </p>

        <dl className="cert-doc-meta">
          <div>
            <dt>Certificate ID</dt>
            <dd className="font-mono">{certId}</dd>
          </div>
          <div>
            <dt>Issue date</dt>
            <dd>{issueDate}</dd>
          </div>
          {recordedAt && (
            <div>
              <dt>On-chain record</dt>
              <dd>{recordedAt}</dd>
            </div>
          )}
        </dl>

        <footer className="cert-doc-footer">
          <div className="cert-doc-proof">
            <p className="cert-doc-proof-title">Cryptographic Integrity Proof</p>
            <p>Stored exclusively as SHA/Keccak hashes on the Ethereum ledger.</p>
            <p className="cert-doc-proof-sub">Raw student data is never written to the blockchain.</p>
          </div>
          {isAuthentic && verifyUrl ? (
            <div className="cert-doc-qr" ref={resolvedQrRef}>
              <QRCodeSVG
                value={verifyUrl}
                size={108}
                level="M"
                includeMargin
                bgColor="#ffffff"
                fgColor="#071a1c"
              />
              <span>Scan to verify</span>
            </div>
          ) : null}
        </footer>
      </div>

      {proofHash && (
        <details className="hash-disclosure no-print">
          <summary>On-chain proof hash</summary>
          <code className="break-all">{proofHash}</code>
        </details>
      )}

      {(showShareActions || actions) && (
        <div className="cert-doc-actions no-print">
          {showShareActions && verifyUrl && (
            <>
              <button type="button" className="btn-primary btn-sm" onClick={() => void handleCopyLink()}>
                {copyStatus === "copied" ? "Copied!" : "Copy verify link"}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => void handleDownloadQr()}>
                Download QR
              </button>
            </>
          )}
          {actions}
          {showShareActions && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => window.print()}>
              Print certificate
            </button>
          )}
        </div>
      )}

      {copyStatus === "failed" && (
        <p className="panel-note text-xs no-print">
          Clipboard permission blocked. Copy the verification link below manually.
        </p>
      )}
    </article>
  );
}
