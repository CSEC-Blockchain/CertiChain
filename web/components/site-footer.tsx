import Link from "next/link";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
const chainName = chainId === 31337 ? "Hardhat Local" : "Ethereum Sepolia";
const explorer =
  contractAddress && chainId !== 31337
    ? `https://sepolia.etherscan.io/address/${contractAddress}`
    : undefined;

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Platform information">
      <div>
        <p className="brand-mark" style={{ fontSize: "1.1rem" }}>
          CertiChain
        </p>
        <p className="footer-tagline">Trusted Credentials. Verified on Blockchain.</p>
        <p style={{ marginTop: "0.5rem" }}>
          Blockchain-powered digital credentials for institutions and independent verifiers.
        </p>
      </div>

      <div>
        <h4>Platform</h4>
        <ul>
          <li>
            <Link href="/issue">Issue a certificate</Link>
          </li>
          <li>
            <Link href="/verify">Verify a certificate</Link>
          </li>
        </ul>
      </div>

      <div>
        <h4>Transparency</h4>
        <ul>
          <li>Network: {chainName}</li>
          <li>
            Contract:{" "}
            {contractAddress ? (
              explorer ? (
                <a href={explorer} target="_blank" rel="noreferrer">
                  {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)} ↗
                </a>
              ) : (
                <code>{contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}</code>
              )
            ) : (
              "not configured"
            )}
          </li>
          <li>Storage: keccak256 hashes only</li>
        </ul>
      </div>

      <div>
        <h4>Privacy</h4>
        <ul>
          <li>No personal data is stored on-chain.</li>
          <li>Verification is public and requires no account.</li>
          <li>Revocation is permanent and issuer-signed.</li>
        </ul>
      </div>

      <p className="footer-bottom" style={{ gridColumn: "1 / -1" }}>
        <span>© CertiChain Registry</span>
        <span>Trusted Credentials. Verified on Blockchain.</span>
      </p>
    </footer>
  );
}
