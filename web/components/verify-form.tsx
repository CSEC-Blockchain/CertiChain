"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useReadContract } from "wagmi";
import { CertificateDocument } from "@/components/certificate-document";
import { QrScanner } from "@/components/qr-scanner";
import {
  certiChain,
  contractAddress,
  formatAddress,
  getExplorerAddressUrl,
  statusLabel,
  Status,
  targetChain,
  type CertificateStatus,
} from "@/lib/contract";
import {
  buildVerifyPath,
  buildVerifyUrl,
  hashCertificateData,
  hashCertificateId,
  parseVerificationInput,
} from "@/lib/hash";
import { useMounted } from "@/lib/use-mounted";

type Query = {
  certIdHash: `0x${string}`;
  dataHash: `0x${string}` | null;
  certId: string;
  studentName: string;
  course: string;
  issueDate: string;
};

function buildQuery(
  certId: string,
  studentName: string,
  course: string,
  issueDate: string,
): Query | null {
  const id = certId.trim();
  const name = studentName.trim();
  const prog = course.trim();
  const date = issueDate.trim();
  if (!id) return null;

  const filledCount = [name, prog, date].filter(Boolean).length;
  if (filledCount > 0 && filledCount < 3) return null;

  return {
    certIdHash: hashCertificateId(id),
    dataHash: filledCount === 3 ? hashCertificateData(name, prog, id, date) : null,
    certId: id,
    studentName: name,
    course: prog,
    issueDate: date,
  };
}

function formatIssuedTimestamp(seconds: bigint | undefined) {
  if (!seconds || seconds === 0n) return "—";
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type InitialVerifyValues = {
  initialId: string;
  initialName: string;
  initialCourse: string;
  initialDate: string;
};

export function VerifyForm() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  return (
    <VerifyFormInner
      key={searchKey}
      initialId={searchParams.get("id") ?? ""}
      initialName={searchParams.get("name") ?? ""}
      initialCourse={searchParams.get("course") ?? ""}
      initialDate={searchParams.get("date") ?? ""}
    />
  );
}

function VerifyFormInner({
  initialId,
  initialName,
  initialCourse,
  initialDate,
}: InitialVerifyValues) {
  const hasInitialDetails = Boolean(initialName || initialCourse || initialDate);

  const [certId, setCertId] = useState(initialId);
  const [studentName, setStudentName] = useState(initialName);
  const [course, setCourse] = useState(initialCourse);
  const [issueDate, setIssueDate] = useState(initialDate);
  const [showDetails, setShowDetails] = useState(hasInitialDetails);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const mounted = useMounted();
  const [query, setQuery] = useState<Query | null>(() =>
    buildQuery(initialId, initialName, initialCourse, initialDate),
  );

  const detailCount = useMemo(
    () => [studentName.trim(), course.trim(), issueDate.trim()].filter(Boolean).length,
    [studentName, course, issueDate],
  );
  const partialDetails = detailCount > 0 && detailCount < 3;

  const scopeKey = String(checkCount);

  const statusById = useReadContract({
    ...certiChain,
    scopeKey,
    functionName: "getCertificateStatus",
    args: query ? [query.certIdHash] : undefined,
    query: { enabled: Boolean(contractAddress && query && !query.dataHash) },
  });

  const statusByHash = useReadContract({
    ...certiChain,
    scopeKey,
    functionName: "verifyCertificate",
    args: query?.dataHash ? [query.certIdHash, query.dataHash] : undefined,
    query: { enabled: Boolean(contractAddress && query?.dataHash) },
  });

  const recordRead = useReadContract({
    ...certiChain,
    scopeKey,
    functionName: "getCertificate",
    args: query ? [query.certIdHash] : undefined,
    query: { enabled: Boolean(contractAddress && query) },
  });

  const applyRawInput = useCallback((raw: string, sourceLabel: string) => {
    const parsed = parseVerificationInput(raw);
    if (!parsed.certId) {
      setImportFeedback(`That ${sourceLabel} did not include a certificate ID.`);
      return;
    }

    const hasDetails = Boolean(parsed.studentName || parsed.course || parsed.issueDate);
    setCertId(parsed.certId);
    setStudentName(parsed.studentName);
    setCourse(parsed.course);
    setIssueDate(parsed.issueDate);
    setShowDetails(hasDetails);
    setImportFeedback(null);

    const built = buildQuery(
      parsed.certId,
      parsed.studentName,
      parsed.course,
      parsed.issueDate,
    );
    setCheckCount((c) => c + 1);
    setQuery(built);
  }, []);

  if (!contractAddress) {
    return (
      <section className="panel">
        <p className="panel-note">Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.</p>
      </section>
    );
  }

  const active = query?.dataHash ? statusByHash : statusById;
  const isFetching = active.isFetching || recordRead.isFetching;
  const isError = active.isError || recordRead.isError;
  const status = active.data as CertificateStatus | undefined;
  const label = statusLabel(status);

  const contractExplorer = getExplorerAddressUrl();
  const record = recordRead.data;
  const recordDataHash = record?.[0];
  const recordIssuedAt = record?.[1];
  const recordExists = record?.[3] ?? false;

  const hashMismatch =
    status === Status.Invalid && Boolean(query?.dataHash) && recordExists;

  function handleCertIdChange(value: string) {
    setImportFeedback(null);
    if (
      value.includes("?id=") ||
      value.includes("/verify?") ||
      /^https?:\/\//i.test(value.trim())
    ) {
      applyRawInput(value, "verification link");
      return;
    }
    setCertId(value);
  }

  function toggleDetails() {
    if (showDetails) {
      setShowDetails(false);
      setStudentName("");
      setCourse("");
      setIssueDate("");
      return;
    }
    setShowDetails(true);
  }

  function resetAll() {
    setCertId("");
    setStudentName("");
    setCourse("");
    setIssueDate("");
    setShowDetails(false);
    setImportFeedback(null);
    setQuery(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setImportFeedback(null);
    const parsed = parseVerificationInput(certId);
    if (parsed.isLink && parsed.certId) {
      applyRawInput(certId, "verification link");
      return;
    }
    setCheckCount((c) => c + 1);
    setQuery(buildQuery(certId, studentName, course, issueDate));
  }

  return (
    <section className="panel">
      {query && (
        <div className="verify-result" role="status">
          {isFetching ? (
            <p className="verify-loading">
              <span className="verify-loading-dot" aria-hidden="true" />
              <span>Checking {targetChain.name} blockchain…</span>
            </p>
          ) : isError ? (
            <p className="status-error">
              Could not reach the CertiChain contract on {targetChain.name}. Check the network
              connection and RPC configuration, then try again.
            </p>
          ) : query.dataHash && status === Status.Valid ? (
            <CertificateDocument
              studentName={query.studentName}
              course={query.course}
              certId={query.certId}
              issueDate={query.issueDate}
              status="valid"
              recordedAt={recordExists ? formatIssuedTimestamp(recordIssuedAt) : undefined}
              proofHash={recordExists && recordDataHash ? recordDataHash : undefined}
              verifyUrl={
                mounted
                  ? buildVerifyUrl(window.location.origin, {
                      certId: query.certId,
                      studentName: query.studentName,
                      course: query.course,
                      issueDate: query.issueDate,
                    })
                  : buildVerifyPath({
                      certId: query.certId,
                      studentName: query.studentName,
                      course: query.course,
                      issueDate: query.issueDate,
                    })
              }
              showShareActions
            />
          ) : (
            <div
              className={`result-card ${
                status === Status.Valid
                  ? "result-card-valid"
                  : status === Status.Revoked
                    ? "result-card-revoked"
                    : "result-card-invalid"
              }`}
            >
              <div className="result-head">
                <span
                  className={
                    status === Status.Valid
                      ? "badge-valid"
                      : status === Status.Revoked
                        ? "badge-revoked"
                        : "badge-invalid"
                  }
                >
                  {status === Status.Valid ? "✓ " : status === Status.Revoked ? "! " : "✕ "}
                  {label}
                </span>
                <p className="panel-note">
                  {status === Status.Valid
                    ? "This Certificate ID is active. Add student details or scan its QR for a full certificate view."
                    : status === Status.Revoked
                      ? "This certificate was cancelled by the issuer."
                      : hashMismatch
                        ? "This ID exists, but the name, course, or date does not match."
                        : "No certificate with this ID was found."}
                </p>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Certificate ID</dt>
                  <dd className="font-mono">{query.certId}</dd>
                </div>
                {query.dataHash && (
                  <>
                    <div>
                      <dt>Student</dt>
                      <dd>{query.studentName}</dd>
                    </div>
                    <div>
                      <dt>Course</dt>
                      <dd>{query.course}</dd>
                    </div>
                    <div>
                      <dt>Issue date</dt>
                      <dd>{query.issueDate}</dd>
                    </div>
                  </>
                )}
                {recordExists && (
                  <div>
                    <dt>Recorded on-chain</dt>
                    <dd>{formatIssuedTimestamp(recordIssuedAt)}</dd>
                  </div>
                )}
              </dl>

              {recordExists && recordDataHash && (
                <details className="hash-disclosure">
                  <summary>On-chain proof hash</summary>
                  <code className="break-all">{recordDataHash}</code>
                </details>
              )}
            </div>
          )}

          <dl className="detail-list result-chain">
            <div>
              <dt>Network</dt>
              <dd>{targetChain.name} · Chain ID {targetChain.id}</dd>
            </div>
            <div>
              <dt>Smart contract</dt>
              <dd>
                {contractExplorer ? (
                  <a
                    className="explorer-link"
                    href={contractExplorer}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {formatAddress(contractAddress)} · View on Etherscan
                  </a>
                ) : (
                  formatAddress(contractAddress)
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <form className="verify-form-layout" onSubmit={onSubmit}>
        <div className="verify-search-row">
          <div className="field">
            <label htmlFor="verify-cert-id">Certificate ID or verification link</label>
            <input
              id="verify-cert-id"
              value={certId}
              onChange={(e) => handleCertIdChange(e.target.value)}
              placeholder="CERT-2026-001 or paste verification link"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary verify-submit-btn"
            disabled={!certId.trim() || partialDetails}
          >
            Verify
          </button>
        </div>

        <div className="verify-tools">
          <QrScanner onDecoded={(raw) => applyRawInput(raw, "QR code")} />
          <div className="verify-tool-right">
            <button type="button" className="inline-link-btn" onClick={toggleDetails}>
              {showDetails ? "− Hide details" : "+ Add student details (optional)"}
            </button>
            {(query || certId || detailCount > 0) && (
              <button type="button" className="inline-link-btn inline-link-muted" onClick={resetAll}>
                Clear
              </button>
            )}
          </div>
        </div>

        {importFeedback && (
          <p className="status-error" role="status">
            {importFeedback}
          </p>
        )}

        {showDetails && (
          <div className="details-group">
            <div className="details-grid">
              <label className="field">
                <span>Student name</span>
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </label>
              <label className="field">
                <span>Course / program</span>
                <input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Computer Science"
                />
              </label>
              <label className="field">
                <span>Issue date</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </label>
            </div>

            {partialDetails && (
              <p role="alert" className="field-hint field-hint-warn">
                Fill in all three fields (name, course, and date), or hide details to verify by ID
                only.
              </p>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
