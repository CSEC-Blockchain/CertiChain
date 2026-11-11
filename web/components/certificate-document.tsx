"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, type ReactNode } from "react";

export type CertificateStatusTone = "valid" | "revoked" | "issued" | "invalid";

export type CertificateDocumentProps = {
  studentName: string;
  course: string;
  certId: string;
  issueDate: string;
  status: CertificateStatusTone;
  verifyUrl?: string | null;
  recordedAt?: string;
  qrRef?: React.RefObject<HTMLDivElement | null>;
  actions?: ReactNode;
};

const STATUS_COPY: Record<CertificateStatusTone, string> = {
  issued: "Recorded on-chain",
  valid: "Verified authentic",
  revoked: "Revoked by issuer",
  invalid: "Not authentic",
};

export function CertificateDocument({
  studentName,
  course,
  certId,
  issueDate,
  status,
  verifyUrl,
  recordedAt,
  qrRef,
  actions,
}: CertificateDocumentProps) {
  const localQrRef = useRef<HTMLDivElement | null>(null);
  const resolvedQrRef = qrRef ?? localQrRef;

  return (
    <article className={`cert-doc cert-doc-${status}`} aria-label="Certificate">
      <div className="cert-doc-frame">
        <header className="cert-doc-header">
          <div className="cert-doc-brand">
            <span className="cert-doc-seal" aria-hidden="true">
              C
            </span>
            <div>
              <p className="cert-doc-org">CertiChain Registry</p>
              <p className="cert-doc-kicker">Blockchain-backed credential</p>
            </div>
          </div>
          <span className={`cert-doc-status cert-doc-status-${status}`}>{STATUS_COPY[status]}</span>
        </header>

        <p className="cert-doc-label">This certifies that</p>
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
            <p>Integrity proof stored as cryptographic hashes on-chain.</p>
            <p className="cert-doc-proof-sub">Raw student data is never written to the ledger.</p>
          </div>
          {verifyUrl ? (
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
      {actions ? <div className="cert-doc-actions no-print">{actions}</div> : null}
    </article>
  );
}
