import type { Metadata } from "next";
import { Cormorant_Garamond, Syne, DM_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUMINARY — Urban Intelligence Platform",
  description:
    "A luxury-grade, AI-powered urban analytics intelligence platform that ingests heterogeneous smart city data and transforms it into predictive decision-grade dashboards.",
  keywords: [
    "urban intelligence", "smart city", "data analytics", "predictive analytics",
    "city pulse", "mobility analytics", "Next.js", "PostgreSQL", "TypeScript",
  ],
  authors: [{ name: "LUMINARY Team" }],
  openGraph: {
    title: "LUMINARY — Urban Intelligence Platform",
    description: "Transforming fragmented urban data streams into predictive intelligence.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${syne.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased bg-ivory text-ink">{children}</body>
    </html>
  );
}
