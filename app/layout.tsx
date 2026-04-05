import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, DM_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  title: "Buena Onda — AI-Powered Ad Management Platform",
  description: "Buena Onda is an autonomous AI agent that launches, optimizes, and reports on your Meta, Google, and TikTok Ads campaigns — with Shopify, Slack, and WhatsApp integrations. Built for agencies and small businesses ready to scale.",
  metadataBase: new URL("https://buenaonda.ai"),
  openGraph: {
    title: "Buena Onda — AI-Powered Ad Management Platform",
    description: "The autonomous AI agent that manages your Meta, Google, and TikTok Ads — with Shopify, Slack, and WhatsApp integrations — like a senior media buyer, around the clock.",
    url: "https://buenaonda.ai",
    siteName: "Buena Onda",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buena Onda — AI-Powered Ad Management Platform",
    description: "The autonomous AI agent that manages your Meta, Google, and TikTok Ads — with Shopify, Slack, and WhatsApp integrations — like a senior media buyer, around the clock.",
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${dmMono.variable} font-sans bg-white text-slate-900 antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
