import type { Metadata } from "next";
import { Newsreader, Outfit } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertiChain — Trusted Credentials. Verified on Blockchain.",
  description:
    "CertiChain is a blockchain-powered digital credential platform. Institutions issue secure digital certificates; anyone can independently verify authenticity with an ID, link, or QR code.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="site-shell">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
