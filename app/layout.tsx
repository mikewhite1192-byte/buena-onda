import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = { title: "Buena Onda – AI Employee", description: "GHL Operator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-slate-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}
