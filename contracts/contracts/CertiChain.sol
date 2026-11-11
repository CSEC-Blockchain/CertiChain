// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CertiChain — hash-based certificate registry
/// @notice Stores certificate hashes only (no personal data on-chain).
contract CertiChain {
    address public immutable owner;

    /// @dev 0 = Invalid (not found / hash mismatch), 1 = Valid, 2 = Revoked
    enum Status {
        Invalid,
        Valid,
        Revoked
    }

    struct Certificate {
        bytes32 dataHash;
        uint64 issuedAt;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;

    event CertificateIssued(
        bytes32 indexed certIdHash,
        bytes32 dataHash,
        address indexed issuer,
        uint64 issuedAt
    );
    event CertificateRevoked(bytes32 indexed certIdHash, address indexed revokedBy);

    error NotOwner();
    error EmptyHash();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Issue a certificate by storing its ID hash and data hash.
    /// @param certIdHash keccak256 of the certificate ID string
    /// @param dataHash keccak256 of (studentName, course, certId, issueDate)
    function issueCertificate(bytes32 certIdHash, bytes32 dataHash) external onlyOwner {
        if (certIdHash == bytes32(0) || dataHash == bytes32(0)) revert EmptyHash();
        if (certificates[certIdHash].exists) revert CertificateAlreadyExists();

        uint64 issuedAt = uint64(block.timestamp);
        certificates[certIdHash] = Certificate({
            dataHash: dataHash,
            issuedAt: issuedAt,
            revoked: false,
            exists: true
        });

        emit CertificateIssued(certIdHash, dataHash, msg.sender, issuedAt);
    }

    /// @notice Revoke an existing certificate.
    function revokeCertificate(bytes32 certIdHash) external onlyOwner {
        Certificate storage cert = certificates[certIdHash];
        if (!cert.exists) revert CertificateNotFound();
        if (cert.revoked) revert CertificateAlreadyRevoked();

        cert.revoked = true;
        emit CertificateRevoked(certIdHash, msg.sender);
    }

    /// @notice Status by certificate ID hash only (no data-hash check).
    function getCertificateStatus(bytes32 certIdHash) external view returns (Status) {
        Certificate storage cert = certificates[certIdHash];
        if (!cert.exists) return Status.Invalid;
        if (cert.revoked) return Status.Revoked;
        return Status.Valid;
    }

    /// @notice Full verification: ID must exist and data hash must match.
    function verifyCertificate(
        bytes32 certIdHash,
        bytes32 dataHash
    ) external view returns (Status) {
        Certificate storage cert = certificates[certIdHash];
        if (!cert.exists || cert.dataHash != dataHash) return Status.Invalid;
        if (cert.revoked) return Status.Revoked;
        return Status.Valid;
    }

    /// @notice Read stored record metadata (hashes only; no PII).
    function getCertificate(
        bytes32 certIdHash
    ) external view returns (bytes32 dataHash, uint64 issuedAt, bool revoked, bool exists) {
        Certificate storage cert = certificates[certIdHash];
        return (cert.dataHash, cert.issuedAt, cert.revoked, cert.exists);
    }
}
