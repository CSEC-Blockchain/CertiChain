import { keccak256, stringToHex } from "viem";

export type CertificateSharePayload = {
  certId: string;
  studentName: string;
  course: string;
  issueDate: string;
};

/** Build a shareable verify path for a certificate payload. */
export function buildVerifyPath(payload: CertificateSharePayload) {
  const params = new URLSearchParams({
    id: payload.certId,
    name: payload.studentName,
    course: payload.course,
    date: payload.issueDate,
  });
  return `/verify?${params.toString()}`;
}

export function buildVerifyUrl(origin: string, payload: CertificateSharePayload) {
  return `${origin.replace(/\/$/, "")}${buildVerifyPath(payload)}`;
}

export function hashCertificateId(certId: string) {
  return keccak256(stringToHex(certId.trim()));
}

export function hashCertificateData(
  studentName: string,
  course: string,
  certId: string,
  issueDate: string,
) {
  return keccak256(
    stringToHex(`${studentName.trim()}|${course.trim()}|${certId.trim()}|${issueDate.trim()}`),
  );
}

export type ParsedVerificationInput = {
  certId: string;
  studentName: string;
  course: string;
  issueDate: string;
  isLink: boolean;
};

/**
 * Parses either a plain certificate ID or a CertiChain verification URL / query string.
 */
export function parseVerificationInput(raw: string): ParsedVerificationInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { certId: "", studentName: "", course: "", issueDate: "", isLink: false };
  }

  let search = "";
  let isLink = false;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      search = url.search;
      isLink = true;
    } catch {
      return { certId: trimmed, studentName: "", course: "", issueDate: "", isLink: false };
    }
  } else if (trimmed.includes("?") || trimmed.startsWith("/verify")) {
    const queryIdx = trimmed.indexOf("?");
    search = queryIdx >= 0 ? trimmed.slice(queryIdx) : "";
    isLink = true;
  } else if (trimmed.includes("id=")) {
    search = `?${trimmed.replace(/^\?/, "")}`;
    isLink = true;
  }

  if (isLink) {
    const params = new URLSearchParams(search);
    return {
      certId: (params.get("id") ?? "").trim(),
      studentName: (params.get("name") ?? "").trim(),
      course: (params.get("course") ?? "").trim(),
      issueDate: (params.get("date") ?? "").trim(),
      isLink: true,
    };
  }

  return {
    certId: trimmed,
    studentName: "",
    course: "",
    issueDate: "",
    isLink: false,
  };
}
