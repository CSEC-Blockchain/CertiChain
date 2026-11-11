import type { Metadata } from "next";
import { Newsreader, Outfit } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/site-header";
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
  title: "CertiChain",
  description:
    "Blockchain-based certificate issuing and verification. Institutions issue hashes; anyone can verify authenticity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="site-shell">
            <SiteHeader />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
