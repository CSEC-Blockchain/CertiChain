"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";

function BrandSeal() {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#134e4a" stroke="#c6a15b" strokeWidth="2.5" />
      <path
        d="M21.5 33.5l7.5 7.5 14.5-16"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" aria-label="CertiChain home">
        <BrandSeal />
        <span>
          CertiChain
          <span className="brand-sub">Registry</span>
        </span>
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
