import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

import { SITE } from "@/lib/site";

import "./globals.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-barlow-condensed", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE.name} · Lumber, Milwaukee Tools & Hardware in Atlanta, MO`, template: `%s · ${SITE.name}` },
  description:
    "Family-owned lumber yard in Atlanta, Missouri. Milwaukee tool deals, hunting blinds, lumber, hardware, electrical and plumbing. Deal alerts by text.",
  openGraph: { siteName: SITE.name, type: "website", locale: "en_US" },
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
