import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero-stage" aria-label="CertiChain introduction">
        <div className="home-hero-copy">
          <p className="brand-hero">CertiChain</p>
          <h1>Issue once. Verify forever.</h1>
          <p className="home-lead">
            Schools and institutions issue certificates on the blockchain. Anyone can check if a
            certificate is real—using an ID, a link, or a QR code.
          </p>
          <div className="cta-row">
            <Link href="/issue" className="btn-primary">
              Issue Certificate
            </Link>
            <Link href="/verify" className="btn-ghost">
              Verify Certificate
            </Link>
          </div>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="hero-cert">
            <div className="hero-cert-top">
              <div className="hero-cert-ribbon">On-chain sealed</div>
              <span className="hero-cert-badge">✓ VALID</span>
            </div>
            <p className="hero-cert-label">Certificate of Completion</p>
            <p className="hero-cert-name">Ada Lovelace</p>
            <p className="hero-cert-course">Computer Science</p>
            <div className="hero-cert-footer">
              <span>CERT-2026-001</span>
              <span className="hero-cert-dot" />
              <span>Hash Verified</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="workflow-heading">
        <div className="section-intro">
          <h2 id="workflow-heading">How it works</h2>
          <p>Three simple steps.</p>
        </div>
        <ol className="simple-steps">
          <li className="simple-step">
            <span className="step-tag">1 · Issue</span>
            <h3>Create the certificate</h3>
            <p>
              Enter the student name, course, ID, and date. Only a secure hash is saved on the
              blockchain—not the personal details themselves.
            </p>
          </li>
          <li className="simple-step">
            <span className="step-tag">2 · Share</span>
            <h3>Send a link or QR</h3>
            <p>Copy the verification link or download the QR code to share with the student.</p>
          </li>
          <li className="simple-step">
            <span className="step-tag">3 · Verify</span>
            <h3>Check anytime</h3>
            <p>
              Paste the ID, open the link, or scan the QR. You will see{" "}
              <strong>VALID</strong>, <strong>INVALID</strong>, or <strong>REVOKED</strong>.
            </p>
          </li>
        </ol>
      </section>

      <section className="home-section logic-panel" aria-labelledby="logic-heading">
        <h2 id="logic-heading">What each result means</h2>
        <ul className="logic-list">
          <li>
            <span className="logic-pill logic-pill-valid">✓ VALID</span> — the certificate was
            issued and is still active.
          </li>
          <li>
            <span className="logic-pill logic-pill-invalid">✕ INVALID</span> — no match was found,
            or the details do not match.
          </li>
          <li>
            <span className="logic-pill logic-pill-revoked">! REVOKED</span> — the certificate was
            cancelled by the issuer.
          </li>
          <li>
            <span className="logic-pill logic-pill-privacy">PRIVACY</span> — student names are
            never stored on-chain, only hashes.
          </li>
        </ul>
      </section>
    </div>
  );
}
