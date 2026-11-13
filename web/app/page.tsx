import Link from "next/link";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
const chainName = chainId === 31337 ? "Hardhat Local" : "Ethereum Sepolia";
const explorer =
  contractAddress && chainId !== 31337
    ? `https://sepolia.etherscan.io/address/${contractAddress}`
    : undefined;

function HeroSeal() {
  return (
    <svg width="120" height="120" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#c6a15b" strokeWidth="2.2" />
      <circle cx="32" cy="32" r="25" fill="#f5f8f7" stroke="#0f766e" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="#0f766e" strokeWidth="1" strokeDasharray="2.5 2.7" opacity="0.7" />
      <path d="M23.5 33.2l6.1 6.1 11-12.4" stroke="#134e4a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero-stage" aria-label="CertiChain introduction">
        <div className="home-hero-copy">
          <p className="page-kicker">Institutional digital credentials · {chainName}</p>
          <p className="brand-hero">CertiChain</p>
          <h1>Trusted Credentials. Verified on Blockchain.</h1>
          <p className="home-lead">
            CertiChain is a blockchain-powered digital credential platform. Institutions issue
            tamper-proof digital certificates, and anyone can independently verify their authenticity
            — using an ID, a link, or a QR code.
          </p>
          <div className="cta-row">
            <Link href="/verify" className="btn-primary">
              Verify a Certificate
            </Link>
            <Link href="/issue" className="btn-ghost">
              Issue for Your Institution
            </Link>
          </div>
          <p className="hero-privacy">
            Privacy by design — only cryptographic hashes are stored on-chain, never names, courses,
            or dates.
          </p>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="hero-cert">
            <div className="hero-cert-top">
              <div className="hero-cert-brandline">
                <HeroSeal />
                <div>
                  <p className="hero-cert-org">CertiChain Registry</p>
                  <p className="hero-cert-org-sub">Official Blockchain Credential</p>
                </div>
              </div>
            </div>
            <p className="hero-cert-label">Certificate of Completion</p>
            <p className="hero-cert-name">Ada Lovelace</p>
            <div className="hero-cert-rule" />
            <p className="hero-cert-course">Computer Science</p>
            <div className="hero-cert-footer">
              <span className="font-mono">CERT-2026-001</span>
              <span className="hero-cert-dot" />
              <span className="hero-cert-valid">✓ Valid on-chain</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="trust-strip" aria-label="Platform guarantees">
        <div className="trust-item">
          <strong>Anchored on-chain</strong>
          <span>Every certificate hash is sealed on the Ethereum ledger.</span>
        </div>
        <div className="trust-item">
          <strong>No PII on-chain</strong>
          <span>Names and records stay off-chain; only proofs are published.</span>
        </div>
        <div className="trust-item">
          <strong>Publicly verifiable</strong>
          <span>Anyone with the ID or QR can check authenticity — no account required.</span>
        </div>
      </section>

      {/* How it works */}
      <section className="home-section" aria-labelledby="workflow-heading">
        <div className="section-intro">
          <h2 id="workflow-heading">How CertiChain works</h2>
          <p>From issuance to independent verification in three steps.</p>
        </div>
        <ol className="simple-steps">
          <li className="simple-step">
            <span className="step-tag">1 · Issue</span>
            <h3>The institution seals it</h3>
            <p>
              The authorized wallet enters the recipient, program, unique Certificate ID, and date.
              A keccak256 fingerprint of the record is written to the smart contract as the only
              on-chain footprint.
            </p>
          </li>
          <li className="simple-step">
            <span className="step-tag">2 · Share</span>
            <h3>The holder keeps the proof</h3>
            <p>
              Issuance returns a shareable verification link and a QR code. The holder can print the
              certificate, add it to a portfolio, or attach it to applications.
            </p>
          </li>
          <li className="simple-step">
            <span className="step-tag">3 · Verify</span>
            <h3>Anyone checks it</h3>
            <p>
              Paste the ID, open the link, or scan the QR. The contract answers with{" "}
              <strong>VALID</strong>, <strong>INVALID</strong>, or <strong>REVOKED</strong> — no
              middlemen, no trust required.
            </p>
          </li>
        </ol>
      </section>

      {/* Who it is for */}
      <section className="home-section" aria-labelledby="audiences-heading">
        <div className="section-intro">
          <h2 id="audiences-heading">Who CertiChain serves</h2>
          <p>One registry, four kinds of trust.</p>
        </div>
        <div className="audience-grid">
          <div className="audience-card">
            <svg className="audience-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 10l9-6 9 6v2H3v-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M5 12v7M9.5 12v7M14.5 12v7M19 12v7M3 19h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>Institutions</h3>
            <p>Issue cohorts of certificates from your authorized wallet and revoke when needed.</p>
          </div>
          <div className="audience-card">
            <svg className="audience-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 20c1.4-3.4 4-5.1 7-5.1s5.6 1.7 7 5.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>Certificate holders</h3>
            <p>Download, print, and share your credential with a link that never expires.</p>
          </div>
          <div className="audience-card">
            <svg className="audience-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <h3>Employers &amp; organizations</h3>
            <p>Verify candidate claims in seconds — no institution phone calls, no forged PDFs.</p>
          </div>
          <div className="audience-card">
            <svg className="audience-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9.5 12l1.8 1.8 3.6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>Public visitors</h3>
            <p>Scan or paste any Certificate ID to confirm authenticity, free and anonymously.</p>
          </div>
        </div>
      </section>

      {/* Transparency & privacy */}
      <section className="home-section" aria-labelledby="chain-heading">
        <div className="section-intro">
          <h2 id="chain-heading">Blockchain transparency</h2>
          <p>
            Verification reads directly from the registry contract — nothing is taken on faith.
          </p>
        </div>
        <div className="chain-grid">
          <div className="simple-step" style={{ contentVisibility: "visible" }}>
            <h3>Why a blockchain?</h3>
            <ul className="logic-list" style={{ paddingLeft: "1.1rem" }}>
              <li>
                <strong>Tamper-proof history.</strong> Certificate fingerprints cannot be altered
                after issuance — by anyone, including the issuer.
              </li>
              <li>
                <strong>No single point of failure.</strong> Verification does not depend on
                CertiChain&apos;s servers staying online.
              </li>
              <li>
                <strong>Privacy first.</strong> Only keccak256 hashes live on-chain. Names, courses,
                and dates never touch the ledger.
              </li>
            </ul>
          </div>
          <dl className="transparency-panel">
            <div>
              <dt>Network</dt>
              <dd>{chainName}</dd>
            </div>
            <div>
              <dt>Registry contract</dt>
              <dd>
                {contractAddress ? (
                  <>
                    <code>{contractAddress}</code>
                    {explorer && (
                      <>
                        {" "}
                        <a href={explorer} target="_blank" rel="noreferrer">
                          View on Etherscan ↗
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  "NEXT_PUBLIC_CONTRACT_ADDRESS is not configured."
                )}
              </dd>
            </div>
            <div>
              <dt>Issuance &amp; revocation</dt>
              <dd>Restricted to the institution&apos;s authorized owner wallet.</dd>
            </div>
            <div>
              <dt>What is stored</dt>
              <dd>certIdHash · dataHash · issue timestamp · revocation flag. Nothing else.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* What results mean */}
      <section className="home-section logic-panel" aria-labelledby="logic-heading">
        <h2 id="logic-heading">What each result means</h2>
        <ul className="logic-list">
          <li>
            <span className="logic-pill logic-pill-valid">✓ Valid</span> — the certificate was
            issued on-chain and is still active.
          </li>
          <li>
            <span className="logic-pill logic-pill-invalid">✕ Invalid</span> — no matching record,
            or the supplied details do not match the sealed fingerprint.
          </li>
          <li>
            <span className="logic-pill logic-pill-revoked">! Revoked</span> — the institution
            revoked this certificate; it is permanently marked invalid.
          </li>
          <li>
            <span className="logic-pill logic-pill-privacy">Privacy</span> — student identity is
            never exposed or stored on-chain; verifiers see only the sealed fingerprint.
          </li>
        </ul>
      </section>
    </div>
  );
}
