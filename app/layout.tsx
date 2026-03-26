import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Buena Onda — AI-Powered Ad Management Platform",
  description: "Buena Onda is an autonomous AI agent that launches, optimizes, and reports on your Meta and Google Ads campaigns 24/7. Built for agencies and small businesses ready to scale.",
  metadataBase: new URL("https://buenaonda.ai"),
  openGraph: {
    title: "Buena Onda — AI-Powered Ad Management Platform",
    description: "The autonomous AI agent that manages your Meta and Google Ads like a senior media buyer — around the clock.",
    url: "https://buenaonda.ai",
    siteName: "Buena Onda",
    images: [{ url: "/brand/bo-logo_wrds.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buena Onda — AI-Powered Ad Management Platform",
    description: "The autonomous AI agent that manages your Meta and Google Ads like a senior media buyer — around the clock.",
    images: ["/brand/bo-logo_wrds.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-slate-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}
