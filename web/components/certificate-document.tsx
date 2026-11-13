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

const STATUS_COPY: Record<CertificateStatusTone, { label: string; valid: boolean }> = {
  issued: { label: "Valid · Issued", valid: true },
  valid: { label: "Valid", valid: true },
  revoked: { label: "Revoked", valid: false },
  invalid: { label: "Invalid", valid: false },
};

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg className={`cert-doc-corner ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M2 62V18C2 8.6 9.6 1 19 1h43" stroke="currentColor" strokeWidth="2.5" />
      <path d="M2 62V30c0-12.2 9.8-22 22-22h38" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="12" cy="52" r="2.4" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function SealEmblem({ size = 56 }: { size?: number }) {
  return (
    <svg className="cert-doc-seal-svg" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="sealFace" cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#1d8a80" />
          <stop offset="55%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#134e4a" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#c6a15b" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="25.5" fill="url(#sealFace)" stroke="#e5d3ac" strokeWidth="0.8" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#c6a15b" strokeWidth="0.9" strokeDasharray="2.4 2.6" opacity="0.9" />
      <path d="M23.5 33.2l6.1 6.1 11-12.4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
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
  const statusValid = statusCopy.valid;

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
      const pngUrl = await rasterizeSvgElementToPng(svg, { qrSize: 360, padding: 36 });
      const link = document.createElement("a");
      link.download = `certichain-${certId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
      link.href = pngUrl;
      link.click();
    } catch {
      if (verifyUrl) window.open(verifyUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <article className={`cert-doc cert-doc-${status}`} aria-label="Certificate of completion">
      <div className="cert-doc-frame">
        <CornerOrnament className="cert-doc-corner-tl" />
        <CornerOrnament className="cert-doc-corner-tr" />
        <CornerOrnament className="cert-doc-corner-bl" />
        <CornerOrnament className="cert-doc-corner-br" />
        <div className="cert-doc-watermark" aria-hidden="true">
          <SealEmblem size={260} />
        </div>

        {/* Brand masthead */}
        <div className="cert-doc-kicker-row">
          <span className="cert-doc-rule" />
          <p className="cert-doc-org">CertiChain Registry</p>
          <span className="cert-doc-rule" />
        </div>
        <p className="cert-doc-org-sub">Official Blockchain Credential · Ethereum Sepolia</p>

        {/* Title */}
        <div className="cert-doc-title-row">
          <span className="cert-doc-rule" />
          <h2 className="cert-doc-title">Certificate of Completion</h2>
          <span className="cert-doc-rule" />
        </div>

        {/* Recipient */}
        <div>
          <p className="cert-doc-label">This certifies that</p>
          <h3 className="cert-doc-name">{studentName}</h3>
          <div className="cert-doc-name-underline" aria-hidden="true" />
          <p className="cert-doc-award">
            has successfully completed the program of study in{" "}
            <strong>{course}</strong>
          </p>
        </div>

        {/* Meta row */}
        <dl className="cert-doc-meta">
          <div>
            <dt>Certificate ID</dt>
            <dd className="font-mono" style={{ wordBreak: "break-word" }}>
              {certId}
            </dd>
          </div>
          <div>
            <dt>Issue date</dt>
            <dd>{issueDate}</dd>
          </div>
          <div>
            <dt>Credential status</dt>
            <dd>
              {statusValid ? (
                <span className="cert-doc-validity">✓ {statusCopy.label}</span>
              ) : (
                <span className="cert-doc-validity" style={{ color: "var(--danger)" }}>
                  {status === "revoked" ? "Revoked" : "Invalid"}
                </span>
              )}
            </dd>
          </div>
        </dl>

        {/* Footer: proof · signature · QR */}
        <div className="cert-doc-footer">
          <div className="cert-doc-proof">
            <p>
              <strong>Authenticity, anchored on-chain.</strong>
            </p>
            <p>
              A cryptographic fingerprint of this credential is sealed on the Ethereum Sepolia
              ledger. No personal data is stored on-chain — only hashes.
            </p>
            <p>
              Scan the QR code or visit the verification page with Certificate ID{" "}
              <code>{certId}</code> to confirm authenticity independently.
            </p>
          </div>

          <div className="cert-doc-signature" aria-hidden="true">
            <span className="cert-doc-signature-script">CertiChain Registry</span>
            <span className="cert-doc-signature-line">Authorized Signatory</span>
          </div>

          {isAuthentic && verifyUrl ? (
            <div className="cert-doc-qr" ref={resolvedQrRef}>
              <QRCodeSVG
                value={verifyUrl}
                size={104}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#134e4a"
              />
              <span>Scan to verify</span>
            </div>
          ) : null}
        </div>
      </div>

      {proofHash && (
        <details className="hash-disclosure no-print">
          <summary>On-chain proof hash</summary>
          <code className="break-all">{proofHash}</code>
        </details>
      )}

      {status === "revoked" && (
        <p className="cert-doc-revoke-note no-print">
          This credential has been revoked by the issuing institution and is no longer valid.
        </p>
      )}

      {recordedAt && (
        <p className="panel-note text-xs no-print">Recorded on-chain: {recordedAt}</p>
      )}

      {(showShareActions || actions) && (
        <div className="cert-doc-actions no-print">
          {showShareActions && verifyUrl && (
            <>
              <button type="button" className="btn-primary btn-sm" onClick={() => void handleCopyLink()}>
                {copyStatus === "copied" ? "Copied to clipboard" : "Copy verify link"}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => void handleDownloadQr()}>
                Download QR
              </button>
            </>
          )}
          {actions}
          {showShareActions && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
          )}
        </div>
      )}

      {copyStatus === "failed" && (
        <p className="panel-note text-xs no-print">
          Clipboard permission blocked. Copy the verification link manually.
        </p>
      )}
    </article>
  );
}
