import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../lib/config";

export const metadata: Metadata = {
  title: "Sell USDT for INR | Bharat OTC",
  description:
    "Sell USDT for INR through a simple OTC settlement service. Check current payout rates, Binance P2P market reference and contact Bharat OTC.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sell USDT for INR | Bharat OTC",
    description: "Clear payout rates and manual INR settlement for USDT sellers.",
    type: "website",
    siteName: siteConfig.name
  },
  twitter: { card: "summary", title: "Sell USDT for INR | Bharat OTC" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
