"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        <span className="brand-seal" aria-hidden="true">
          C
        </span>
        <span>CertiChain</span>
      </Link>
      <nav className="site-nav" aria-label="Primary">
        <Link
          href="/issue"
          className={`nav-link${pathname === "/issue" ? " nav-link-active" : ""}`}
          aria-current={pathname === "/issue" ? "page" : undefined}
        >
          Issue
        </Link>
        <Link
          href="/verify"
          className={`nav-link${pathname === "/verify" ? " nav-link-active" : ""}`}
          aria-current={pathname === "/verify" ? "page" : undefined}
        >
          Verify
        </Link>
        <WalletButton />
      </nav>
    </header>
  );
}
