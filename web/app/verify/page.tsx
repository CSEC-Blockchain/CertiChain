import { Suspense } from "react";
import { VerifyForm } from "@/components/verify-form";

export default function VerifyPage() {
  return (
    <div className="narrow-page">
      <div className="page-head">
        <p className="page-kicker">Anyone can check</p>
        <h1>Verify Certificate</h1>
        <p>
          Enter a Certificate ID, paste a link, or scan a QR code. No wallet needed. Add student
          details if you want a full match check.
        </p>
      </div>
      <Suspense fallback={<p className="panel-note">Loading verifier…</p>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
