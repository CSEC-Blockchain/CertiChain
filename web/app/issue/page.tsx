import { Suspense } from "react";
import { IssueForm } from "@/components/issue-form";
import { RevokeForm } from "@/components/revoke-form";

export default function IssuePage() {
  return (
    <div className="narrow-page">
      <div className="page-head">
        <p className="page-kicker">For institutions</p>
        <h1>Issue Certificate</h1>
        <p>
          Connect the authorized wallet, fill in the student details, and confirm in your wallet.
          After it succeeds, you get a shareable link and QR code.
        </p>
      </div>
      <Suspense fallback={<p className="panel-note">Loading issuer…</p>}>
        <IssueForm />
      </Suspense>
      <Suspense fallback={null}>
        <RevokeForm />
      </Suspense>
    </div>
  );
}
