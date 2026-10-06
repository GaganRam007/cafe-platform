import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CafeProviders } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Aura Cafe | Operating System & QR Dining",
  description: "Next-generation cafe management platform with live KDS, table floor plan, inventory costing, and customer QR ordering.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aura Cafe",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased selection:bg-amber-200 selection:text-amber-900">
      <body className="min-h-full flex flex-col font-sans bg-[#FAF7F2] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 antialiased">
        <CafeProviders>{children}</CafeProviders>
      </body>
    </html>
  );
}
