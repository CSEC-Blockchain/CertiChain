import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, stringToHex } from "viem";
import {
  buildVerifyPath,
  buildVerifyUrl,
  hashCertificateData,
  hashCertificateId,
  parseVerificationInput,
} from "./hash.ts";

describe("hashCertificateId / hashCertificateData", () => {
  it("matches keccak256(stringToHex(...)) used by the contract tests", () => {
    const id = "CERT-2026-001";
    assert.equal(hashCertificateId(id), keccak256(stringToHex(id)));
    assert.equal(hashCertificateId(`  ${id}  `), hashCertificateId(id));

    const data = hashCertificateData("Ada Lovelace", "Computer Science", id, "2026-11-11");
    assert.equal(
      data,
      keccak256(stringToHex("Ada Lovelace|Computer Science|CERT-2026-001|2026-11-11")),
    );
  });

  it("trims all fields before hashing data", () => {
    const a = hashCertificateData("Ada", "CS", "C1", "2026-01-01");
    const b = hashCertificateData("  Ada  ", " CS ", " C1 ", " 2026-01-01 ");
    assert.equal(a, b);
  });
});

describe("parseVerificationInput", () => {
  it("treats a plain string as a certificate ID", () => {
    const parsed = parseVerificationInput("CERT-9");
    assert.deepEqual(parsed, {
      certId: "CERT-9",
      studentName: "",
      course: "",
      issueDate: "",
      isLink: false,
    });
  });

  it("parses absolute verify URLs with student details", () => {
    const url =
      "http://localhost:3000/verify?id=CERT-1&name=Ada%20Lovelace&course=CS&date=2026-11-11";
    const parsed = parseVerificationInput(url);
    assert.equal(parsed.isLink, true);
    assert.equal(parsed.certId, "CERT-1");
    assert.equal(parsed.studentName, "Ada Lovelace");
    assert.equal(parsed.course, "CS");
    assert.equal(parsed.issueDate, "2026-11-11");
  });

  it("parses relative /verify paths and raw query strings", () => {
    const relative = parseVerificationInput("/verify?id=C2&name=Bob&course=Math&date=2026-01-02");
    assert.equal(relative.certId, "C2");
    assert.equal(relative.studentName, "Bob");
    assert.equal(relative.isLink, true);

    const query = parseVerificationInput("id=C3&name=Eve&course=Bio&date=2026-03-03");
    assert.equal(query.certId, "C3");
    assert.equal(query.course, "Bio");
    assert.equal(query.isLink, true);
  });

  it("returns empty certId for malformed absolute URLs without id", () => {
    const parsed = parseVerificationInput("https://example.com/verify?name=Only");
    assert.equal(parsed.isLink, true);
    assert.equal(parsed.certId, "");
  });
});

describe("buildVerifyPath / buildVerifyUrl", () => {
  it("builds a path that round-trips through parseVerificationInput", () => {
    const payload = {
      certId: "CERT-ROUND",
      studentName: "Grace Hopper",
      course: "COBOL",
      issueDate: "2026-05-05",
    };
    const path = buildVerifyPath(payload);
    const parsed = parseVerificationInput(path);
    assert.equal(parsed.certId, payload.certId);
    assert.equal(parsed.studentName, payload.studentName);
    assert.equal(parsed.course, payload.course);
    assert.equal(parsed.issueDate, payload.issueDate);

    const url = buildVerifyUrl("http://localhost:3000/", payload);
    assert.equal(url, `http://localhost:3000${path}`);
    const fromUrl = parseVerificationInput(url);
    assert.equal(fromUrl.certId, payload.certId);
    assert.equal(fromUrl.studentName, payload.studentName);
  });
});
