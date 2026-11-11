import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, stringToHex } from "viem";
import { network } from "hardhat";

const { viem } = await network.create();

const Status = { Invalid: 0, Valid: 1, Revoked: 2 } as const;

function hashId(id: string) {
  return keccak256(stringToHex(id));
}

function hashData(studentName: string, course: string, certId: string, issueDate: string) {
  return keccak256(stringToHex(`${studentName}|${course}|${certId}|${issueDate}`));
}

describe("CertiChain", async function () {
  it("sets the deployer as owner", async function () {
    const [deployer] = await viem.getWalletClients();
    const contract = await viem.deployContract("CertiChain");

    assert.equal(
      (await contract.read.owner()).toLowerCase(),
      deployer.account.address.toLowerCase(),
    );
  });

  it("issues a certificate and reports Valid", async function () {
    const contract = await viem.deployContract("CertiChain");

    const certIdHash = hashId("CERT-001");
    const dataHash = hashData("Ada Lovelace", "Computer Science", "CERT-001", "2026-11-11");

    await viem.assertions.emit(
      contract.write.issueCertificate([certIdHash, dataHash]),
      contract,
      "CertificateIssued",
    );

    assert.equal(await contract.read.getCertificateStatus([certIdHash]), Status.Valid);
    assert.equal(await contract.read.verifyCertificate([certIdHash, dataHash]), Status.Valid);

    const record = await contract.read.getCertificate([certIdHash]);
    assert.equal(record[0], dataHash);
    assert.equal(record[2], false);
    assert.equal(record[3], true);
  });

  it("returns Invalid for unknown or mismatched hashes", async function () {
    const contract = await viem.deployContract("CertiChain");
    const certIdHash = hashId("CERT-002");
    const dataHash = hashData("Alan Turing", "Mathematics", "CERT-002", "2026-01-01");
    const wrongHash = hashData("Wrong", "Wrong", "CERT-002", "2026-01-01");

    assert.equal(await contract.read.getCertificateStatus([certIdHash]), Status.Invalid);

    await contract.write.issueCertificate([certIdHash, dataHash]);
    assert.equal(await contract.read.verifyCertificate([certIdHash, wrongHash]), Status.Invalid);
  });

  it("prevents duplicate certificate IDs", async function () {
    const contract = await viem.deployContract("CertiChain");
    const certIdHash = hashId("CERT-003");
    const dataHash = hashData("Grace Hopper", "COBOL", "CERT-003", "2026-05-05");

    await contract.write.issueCertificate([certIdHash, dataHash]);
    await viem.assertions.revertWithCustomError(
      contract.write.issueCertificate([certIdHash, dataHash]),
      contract,
      "CertificateAlreadyExists",
    );
  });

  it("reverts EmptyHash for zero hashes", async function () {
    const contract = await viem.deployContract("CertiChain");
    const zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const dataHash = hashData("A", "B", "C", "D");

    await viem.assertions.revertWithCustomError(
      contract.write.issueCertificate([zero, dataHash]),
      contract,
      "EmptyHash",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.issueCertificate([hashId("X"), zero]),
      contract,
      "EmptyHash",
    );
  });

  it("revokes a certificate and reports Revoked", async function () {
    const [deployer] = await viem.getWalletClients();
    const contract = await viem.deployContract("CertiChain");
    const certIdHash = hashId("CERT-004");
    const dataHash = hashData("Barbara Liskov", "Distributed Systems", "CERT-004", "2026-03-03");

    await contract.write.issueCertificate([certIdHash, dataHash]);
    await viem.assertions.emitWithArgs(
      contract.write.revokeCertificate([certIdHash]),
      contract,
      "CertificateRevoked",
      [certIdHash, deployer.account.address],
    );

    assert.equal(await contract.read.getCertificateStatus([certIdHash]), Status.Revoked);
    assert.equal(await contract.read.verifyCertificate([certIdHash, dataHash]), Status.Revoked);

    await viem.assertions.revertWithCustomError(
      contract.write.issueCertificate([certIdHash, dataHash]),
      contract,
      "CertificateAlreadyExists",
    );
  });

  it("reverts revoke when missing or already revoked", async function () {
    const contract = await viem.deployContract("CertiChain");
    const certIdHash = hashId("CERT-005");
    const dataHash = hashData("Ken Thompson", "Unix", "CERT-005", "2026-02-02");

    await viem.assertions.revertWithCustomError(
      contract.write.revokeCertificate([certIdHash]),
      contract,
      "CertificateNotFound",
    );

    await contract.write.issueCertificate([certIdHash, dataHash]);
    await contract.write.revokeCertificate([certIdHash]);
    await viem.assertions.revertWithCustomError(
      contract.write.revokeCertificate([certIdHash]),
      contract,
      "CertificateAlreadyRevoked",
    );
  });

  it("blocks non-owners from issuing or revoking", async function () {
    const [, other] = await viem.getWalletClients();
    const contract = await viem.deployContract("CertiChain");
    const certIdHash = hashId("CERT-006");
    const dataHash = hashData("Dennis Ritchie", "C", "CERT-006", "2026-04-04");

    await viem.assertions.revertWithCustomError(
      contract.write.issueCertificate([certIdHash, dataHash], { account: other.account }),
      contract,
      "NotOwner",
    );

    await contract.write.issueCertificate([certIdHash, dataHash]);
    await viem.assertions.revertWithCustomError(
      contract.write.revokeCertificate([certIdHash], { account: other.account }),
      contract,
      "NotOwner",
    );
  });
});
